# 📁 Project Structure

## Overview

This document describes the organized folder structure of the Leaf Disease Detection System.

---

## 🗂️ Directory Tree

```
leaf-disease-detection/
│
├── 📄 .env                          # Environment variables (gitignored)
├── 📄 .env.example                  # Environment template
├── 📄 .gitignore                    # Git ignore rules
├── 📄 LICENSE                       # MIT License
├── 📄 README.md                     # Main project documentation
├── 📄 requirements.txt              # Python dependencies
├── 📄 vercel.json                   # Vercel deployment config
│
├── 📂 src/                          # ⭐ SOURCE CODE
│   ├── 📄 __init__.py
│   ├── 📄 app.py                    # FastAPI application entry point
│   ├── 📄 main.py                   # Streamlit application entry point
│   ├── 📄 utils.py                  # Utility functions
│   │
│   ├── 📂 auth/                     # Authentication & Authorization
│   │   ├── __init__.py
│   │   ├── routes.py                # Auth API endpoints
│   │   └── security.py              # JWT, password hashing
│   │
│   ├── 📂 database/                 # Database Layer
│   │   ├── __init__.py
│   │   ├── connection.py            # MongoDB connection
│   │   └── models.py                # Pydantic models
│   │
│   ├── 📂 routes/                   # API Routes
│   │   ├── __init__.py
│   │   └── disease_detection.py    # Disease detection endpoints
│   │
│   ├── 📂 services/                 # External Services
│   │   ├── __init__.py
│   │   └── perplexity_service.py   # Perplexity API integration
│   │
│   ├── 📂 storage/                  # File Storage
│   │   ├── __init__.py
│   │   ├── image_storage.py        # Image file management
│   │   └── uploads/                # User uploaded images
│   │
│   └── 📂 core/                     # Core AI Engine
│       ├── __init__.py
│       └── disease_detector.py     # AI disease detection logic
│
├── 📂 frontend/                     # ⭐ FRONTEND APPLICATION
│   ├── 📄 index.html                # Landing page
│   ├── 📄 login.html                # Login page
│   ├── 📄 register.html             # Registration page
│   ├── 📄 dashboard.html            # Main dashboard
│   ├── 📄 history.html              # Analysis history
│   ├── 📄 README.md                 # Frontend documentation
│   │
│   └── 📂 js/                       # JavaScript modules
│       ├── auth.js                  # Authentication logic
│       ├── dashboard.js             # Dashboard functionality
│       ├── history.js               # History page logic
│       └── validation.js            # Form validation
│
├── 📂 tests/                        # ⭐ TEST FILES
│   ├── __init__.py
│   ├── test_api.py                  # API endpoint tests
│   ├── test_auth.py                 # Authentication tests
│   └── test_perplexity.py           # Perplexity service tests
│
├── 📂 scripts/                      # ⭐ UTILITY SCRIPTS
│   ├── __init__.py
│   ├── create_admin.py              # Create admin user
│   ├── setup.py                     # Setup automation
│   ├── migrate_structure.ps1        # Migration script (PowerShell)
│   └── fix_imports.ps1              # Import fixer (PowerShell)
│
├── 📂 docs/                         # ⭐ DOCUMENTATION
│   ├── 📄 README.md                 # Documentation index
│   │
│   ├── 📂 setup/                    # Setup Guides
│   │   ├── QUICKSTART.md            # 5-minute setup
│   │   ├── INSTALLATION.md          # Detailed installation
│   │   └── ADMIN_SETUP.md           # Admin configuration
│   │
│   ├── 📂 features/                 # Feature Documentation
│   │   ├── AUTHENTICATION.md        # Auth system guide
│   │   ├── FRONTEND_GUIDE.md        # Frontend architecture
│   │   ├── VALIDATION_GUIDE.md      # Input validation
│   │   ├── PRESCRIPTION_GENERATOR.md # Prescription system
│   │   ├── ADMIN_PANEL.md           # Admin features
│   │   └── PDF_EXPORT.md            # PDF generation
│   │
│   └── 📂 architecture/             # Architecture Docs
│       ├── architecture.md          # System architecture
│       ├── dfd_level0.mmd           # Data flow diagram L0
│       └── dfd_level1.mmd           # Data flow diagram L1
│
├── 📂 config/                       # ⭐ CONFIGURATION
│   ├── .streamlit/                  # Streamlit config
│   │   └── config.toml
│   └── .devcontainer/               # Dev container config
│       └── devcontainer.json
│
└── 📂 logs/                         # Application logs (gitignored)
    └── disease_detection.log
```

---

## 📦 Module Descriptions

### `src/` - Source Code
The heart of the application containing all Python code.

**Key Files:**
- `app.py` - FastAPI application with REST API endpoints
- `main.py` - Streamlit web interface
- `utils.py` - Shared utility functions

**Modules:**
- `auth/` - User authentication, JWT tokens, password hashing
- `database/` - MongoDB connection and Pydantic models
- `routes/` - API route handlers
- `services/` - External API integrations (Perplexity)
- `storage/` - File storage management
- `core/` - AI disease detection engine

### `frontend/` - Web Interface
Modern, responsive web interface built with HTML, Tailwind CSS, and vanilla JavaScript.

**Pages:**
- `index.html` - Marketing landing page
- `login.html` - User login
- `register.html` - User registration
- `dashboard.html` - Main analysis interface
- `history.html` - Analysis history viewer

**JavaScript:**
- `auth.js` - Authentication and token management
- `dashboard.js` - Image upload and analysis
- `history.js` - History display and management
- `validation.js` - Form validation utilities

### `tests/` - Test Suite
Automated tests for all major components.

- `test_api.py` - API endpoint testing
- `test_auth.py` - Authentication flow testing
- `test_perplexity.py` - Perplexity service testing

**Run tests:**
```bash
python -m pytest tests/
```

### `scripts/` - Utility Scripts
Helper scripts for setup, administration, and maintenance.

- `create_admin.py` - Create admin users
- `setup.py` - Automated setup
- `migrate_structure.ps1` - Project restructure script
- `fix_imports.ps1` - Import statement fixer

### `docs/` - Documentation
Comprehensive documentation organized by category.

**Categories:**
- `setup/` - Installation and setup guides
- `features/` - Feature-specific documentation
- `architecture/` - System design and architecture

---

## 🚀 Running the Application

### FastAPI Backend
```bash
# From project root
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000

# Access at: http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Streamlit Frontend
```bash
# From project root
streamlit run src/main.py --server.port 8501

# Access at: http://localhost:8501
```

---

## 📝 Import Conventions

### Within `src/` modules
Use absolute imports from `src`:

```python
# ✅ Correct
from src.database.models import User
from src.auth.security import get_current_user
from src.services.perplexity_service import get_perplexity_service

# ❌ Incorrect
from database.models import User
from auth.security import get_current_user
```

### In test files
Import from `src`:

```python
# ✅ Correct
from src.services.perplexity_service import PerplexityService
from src.database.models import AnalysisRecord

# ❌ Incorrect
from services.perplexity_service import PerplexityService
```

---

## 🔧 Development Workflow

### 1. Setup Development Environment
```bash
# Clone repository
git clone https://github.com/shukur-alom/leaf-diseases-detect.git
cd leaf-diseases-detect

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start Development Servers
```bash
# Terminal 1: Backend
uvicorn src.app:app --reload

# Terminal 2: Frontend (optional)
streamlit run src.main.py
```

### 3. Make Changes
- Edit files in `src/` for backend changes
- Edit files in `frontend/` for UI changes
- Add tests in `tests/`
- Update docs in `docs/`

### 4. Test Changes
```bash
# Run tests
python -m pytest tests/

# Test specific file
python -m pytest tests/test_api.py

# Test with coverage
python -m pytest tests/ --cov=src
```

---

## 📚 Documentation Quick Links

- **Getting Started**: [setup/QUICKSTART.md](setup/QUICKSTART.md)
- **Full Setup**: [setup/INSTALLATION.md](setup/INSTALLATION.md)
- **Authentication**: [features/AUTHENTICATION.md](features/AUTHENTICATION.md)
- **Architecture**: [architecture/architecture.md](architecture/architecture.md)

---

**Last Updated**: December 4, 2024  
**Version**: 2.0  
**Status**: ✅ Production Ready
