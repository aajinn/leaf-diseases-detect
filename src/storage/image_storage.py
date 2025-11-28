"""
Local Image Storage Manager
===========================

Handles saving and retrieving leaf images locally.
"""

import os
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional
import shutil

# Storage configuration
UPLOAD_DIR = Path("storage/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename with timestamp and UUID"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    extension = Path(original_filename).suffix
    return f"{timestamp}_{unique_id}{extension}"


def save_image(file_content: bytes, original_filename: str, username: str) -> tuple[str, str]:
    """
    Save image to local storage
    
    Args:
        file_content: Image file content in bytes
        original_filename: Original filename
        username: Username of uploader
    
    Returns:
        tuple: (filename, full_path)
    """
    # Create user directory
    user_dir = UPLOAD_DIR / username
    user_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    filename = generate_unique_filename(original_filename)
    file_path = user_dir / filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    return filename, str(file_path)


def get_image_path(username: str, filename: str) -> Optional[Path]:
    """Get full path to image file"""
    file_path = UPLOAD_DIR / username / filename
    if file_path.exists():
        return file_path
    return None


def delete_image(username: str, filename: str) -> bool:
    """Delete image from storage"""
    file_path = get_image_path(username, filename)
    if file_path and file_path.exists():
        file_path.unlink()
        return True
    return False


def get_user_images(username: str) -> list[str]:
    """Get list of all images for a user"""
    user_dir = UPLOAD_DIR / username
    if not user_dir.exists():
        return []
    return [f.name for f in user_dir.iterdir() if f.is_file()]


def cleanup_user_storage(username: str) -> bool:
    """Delete all images for a user"""
    user_dir = UPLOAD_DIR / username
    if user_dir.exists():
        shutil.rmtree(user_dir)
        return True
    return False
