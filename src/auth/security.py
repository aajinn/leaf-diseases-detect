"""
Authentication and Security Module
==================================

Handles password hashing, JWT token generation, and user authentication.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from src.database.connection import USERS_COLLECTION, MongoDB
from src.database.models import TokenData, UserInDB

load_dotenv()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        # Ensure password is bytes and truncate if necessary
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = (
            hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password
        )
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    try:
        # Ensure password is bytes and truncate to 72 bytes (bcrypt limit)
        password_bytes = password.encode("utf-8")[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode("utf-8")
    except Exception as e:
        print(f"Password hashing error: {e}")
        raise ValueError(f"Failed to hash password: {str(e)}")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_user_by_username(username: str) -> Optional[UserInDB]:
    """Get user from database by username"""
    users_collection = MongoDB.get_collection(USERS_COLLECTION)
    user_data = await users_collection.find_one({"username": username})
    if user_data:
        return UserInDB(**user_data)
    return None


async def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    """Authenticate user with username and password"""
    # Search case-insensitive
    user = await get_user_by_username(username.lower())
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, is_admin=payload.get("is_admin", False))
    except JWTError:
        raise credentials_exception

    user = await get_user_by_username(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_admin_user(
    current_user: UserInDB = Depends(get_current_active_user),
) -> UserInDB:
    """Get current admin user"""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user


# Alias for backward compatibility
require_admin = get_current_admin_user
