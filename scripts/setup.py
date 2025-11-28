"""
Setup Script for Leaf Disease Detection System
==============================================

Run this script to set up the application.
"""

import os
import sys
import secrets
from pathlib import Path


def create_env_file():
    """Create .env file from template"""
    env_example = Path(".env.example")
    env_file = Path(".env")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return
    
    if not env_example.exists():
        print("❌ .env.example not found!")
        return
    
    # Read template
    with open(env_example, 'r') as f:
        content = f.read()
    
    # Generate SECRET_KEY
    secret_key = secrets.token_hex(32)
    content = content.replace(
        "your-secret-key-change-in-production-use-openssl-rand-hex-32",
        secret_key
    )
    
    # Write .env file
    with open(env_file, 'w') as f:
        f.write(content)
    
    print("✅ Created .env file with generated SECRET_KEY")
    print(f"   SECRET_KEY: {secret_key[:20]}...")
    print("\n⚠️  Remember to set your GROQ_API_KEY in .env file!")


def create_directories():
    """Create necessary directories"""
    directories = [
        "storage/uploads",
        "logs"
    ]
    
    for directory in directories:
        path = Path(directory)
        path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")


def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        "fastapi",
        "uvicorn",
        "motor",
        "pymongo",
        "groq",
        "python-jose",
        "passlib",
        "streamlit"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("\n⚠️  Missing packages detected:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n💡 Install with: pip install -r requirements.txt")
        return False
    else:
        print("\n✅ All required packages are installed")
        return True


def main():
    """Main setup function"""
    print("=" * 60)
    print("Leaf Disease Detection System - Setup")
    print("=" * 60)
    print()
    
    # Create directories
    print("1. Creating directories...")
    create_directories()
    print()
    
    # Create .env file
    print("2. Setting up environment file...")
    create_env_file()
    print()
    
    # Check dependencies
    print("3. Checking dependencies...")
    deps_ok = check_dependencies()
    print()
    
    # Final instructions
    print("=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    print()
    
    if not deps_ok:
        print("⚠️  Next steps:")
        print("   1. Install dependencies: pip install -r requirements.txt")
        print("   2. Set GROQ_API_KEY in .env file")
        print("   3. Start MongoDB: mongod")
        print("   4. Create admin user: python scripts/create_admin.py")
        print("   5. Start server: uvicorn app:app --reload")
    else:
        print("✅ Next steps:")
        print("   1. Set GROQ_API_KEY in .env file")
        print("   2. Start MongoDB: mongod")
        print("   3. Create admin user: python scripts/create_admin.py")
        print("   4. Start server: uvicorn app:app --reload")
    
    print()
    print("📚 Documentation:")
    print("   - Quick Start: QUICKSTART.md")
    print("   - Full Guide: README_AUTH.md")
    print("   - API Docs: http://localhost:8000/docs (after starting server)")
    print()


if __name__ == "__main__":
    main()
