"""
Authentication Routes
====================

API endpoints for user registration, login, and profile management.
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from src.database.models import UserCreate, User, Token, UserInDB
from src.database.connection import MongoDB, USERS_COLLECTION
from src.auth.security import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_current_admin_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """Register a new user with validation"""
    users_collection = MongoDB.get_collection(USERS_COLLECTION)
    
    # Validate password strength
    try:
        UserCreate.validate_password(user.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Validate username format
    if not user.username.replace('_', '').replace('-', '').isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain letters, numbers, hyphens, and underscores"
        )
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"username": user.username.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    existing_email = await users_collection.find_one({"email": user.email.lower()})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_dict = user.dict()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["username"] = user_dict["username"].lower()  # Store username in lowercase
    user_dict["email"] = user_dict["email"].lower()  # Store email in lowercase
    
    user_in_db = UserInDB(**user_dict)
    result = await users_collection.insert_one(user_in_db.dict(by_alias=True))
    
    created_user = await users_collection.find_one({"_id": result.inserted_id})
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
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "is_admin": user.is_admin},
        expires_delta=access_token_expires
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
        created_at=current_user.created_at
    )


@router.get("/users", response_model=list[User])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_admin_user)
):
    """List all users (admin only)"""
    users_collection = MongoDB.get_collection(USERS_COLLECTION)
    users_cursor = users_collection.find().skip(skip).limit(limit)
    users = await users_cursor.to_list(length=limit)
    return [User(**user) for user in users]


@router.delete("/users/{username}")
async def delete_user(
    username: str,
    current_user: UserInDB = Depends(get_current_admin_user)
):
    """Delete a user (admin only)"""
    users_collection = MongoDB.get_collection(USERS_COLLECTION)
    
    # Prevent admin from deleting themselves
    if username == current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    result = await users_collection.delete_one({"username": username})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": f"User {username} deleted successfully"}

