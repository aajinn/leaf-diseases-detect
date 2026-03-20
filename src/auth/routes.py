"""
Authentication Routes
====================

API endpoints for user registration, login, and profile management.
"""

from datetime import timedelta, datetime
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from src.auth.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_current_admin_user,
    get_password_hash,
)
from src.database.connection import USERS_COLLECTION, MongoDB
from src.database.models import Token, User, UserCreate, UserInDB
from src.utils.system_settings import ensure_auth_allowed_for_user, ensure_registration_allowed
from src.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """Register a new user with validation"""
    await ensure_registration_allowed()
    users_collection = MongoDB.get_collection(USERS_COLLECTION)

    # Validate password strength
    try:
        UserCreate.validate_password(user.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Validate username format
    if not user.username.replace("_", "").replace("-", "").isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain letters, numbers, hyphens, and underscores",
        )

    # Check if user already exists
    existing_user = await users_collection.find_one({"username": user.username.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    existing_email = await users_collection.find_one({"email": user.email.lower()})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Create user
    user_dict = user.dict()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["username"] = user_dict["username"].lower()  # Store username in lowercase
    user_dict["email"] = user_dict["email"].lower()  # Store email in lowercase

    user_in_db = UserInDB(**user_dict)
    result = await users_collection.insert_one(user_in_db.dict(by_alias=True))

    created_user = await users_collection.find_one({"_id": result.inserted_id})
    
    # Assign free plan to new user
    try:
        from src.services.subscription_service import SubscriptionService
        await SubscriptionService.assign_free_plan(
            user_id=str(result.inserted_id),
            username=user_dict["username"]
        )
    except Exception as e:
        # Log but don't fail registration
        import logging
        logging.getLogger(__name__).error(f"Failed to assign free plan: {str(e)}")
    
    # Convert MongoDB ObjectId to string for pydantic model validation
    if created_user and "_id" in created_user:
        created_user["_id"] = str(created_user["_id"])
    return User(**created_user)


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get access token"""
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    await ensure_auth_allowed_for_user(user.is_admin)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "is_admin": user.is_admin},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    """Get current user profile"""
    return User(
        _id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
    )


@router.get("/users", response_model=list[User])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_admin_user),
):
    """List all users (admin only)"""
    users_collection = MongoDB.get_collection(USERS_COLLECTION)
    users_cursor = users_collection.find().skip(skip).limit(limit)
    users = await users_cursor.to_list(length=limit)
    # Ensure ObjectId values are converted to strings for pydantic
    for u in users:
        if u and "_id" in u:
            u["_id"] = str(u["_id"])
    return [User(**user) for user in users]


@router.get("/users/search", response_model=list[User])
async def search_users(
    q: str,
    limit: int = 10,
    current_user: UserInDB = Depends(get_current_admin_user),
):
    """
    Search users by username or email for admin use.
    Excludes admin accounts.
    """
    users_collection = MongoDB.get_collection(USERS_COLLECTION)

    query = {
        "is_admin": False,
        "$or": [
            {"username": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ],
    }

    cursor = users_collection.find(query).limit(limit)
    users = await cursor.to_list(length=limit)

    for u in users:
        if u and "_id" in u:
            u["_id"] = str(u["_id"])

    return [User(**user) for user in users]


@router.delete("/users/{username}")
async def delete_user(username: str, current_user: UserInDB = Depends(get_current_admin_user)):
    """Delete a user (admin only)"""
    users_collection = MongoDB.get_collection(USERS_COLLECTION)

    # Prevent admin from deleting themselves
    if username == current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    result = await users_collection.delete_one({"username": username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": f"User {username} deleted successfully"}


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset email"""
    users_collection = MongoDB.get_collection(USERS_COLLECTION)
    
    # Find user by email
    user = await users_collection.find_one({"email": request.email.lower()})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    
    # Store reset token in database
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": reset_token_expires
            }
        }
    )
    
    # Send email
    email_sent = email_service.send_password_reset_email(
        to_email=user["email"],
        reset_token=reset_token,
        username=user["username"]
    )
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email. Please try again later."
        )
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token"""
    users_collection = MongoDB.get_collection(USERS_COLLECTION)
    
    # Find user with valid reset token
    user = await users_collection.find_one({
        "reset_token": request.token,
        "reset_token_expires": {"$gt": datetime.utcnow()}
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Validate new password
    try:
        UserCreate.validate_password(request.new_password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Update password and clear reset token
    hashed_password = get_password_hash(request.new_password)
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"hashed_password": hashed_password},
            "$unset": {"reset_token": "", "reset_token_expires": ""}
        }
    )
    
    return {"message": "Password reset successfully"}
