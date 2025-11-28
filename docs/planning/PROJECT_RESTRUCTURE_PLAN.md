# 📁 Project Restructure Plan

## New Folder Structure

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
├── 📂 src/                          # Source code (core application)
│   ├── 📄 __init__.py
│   ├── 📄 app.py                    # FastAPI application
│   ├── 📄 main.py                   # Streamlit application
│   ├── 📄 utils.py                  # Utility functions
│   │
│   ├── 📂 auth/                     # Authentication module
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── security.py
│   │
│   ├── 📂 database/                 # Database module
│   │   ├── __init__.py
│   │   ├── connection.py
│   │   └── models.py
│   │
│   ├── 📂 routes/                   # API routes
│   │   ├── __init__.py
│   │   └── disease_detection.py
│   │
│   ├── 📂 services/                 # External services
│   │   ├── __init__.py
│   │   └── perplexity_service.py
│   │
│   ├── 📂 storage/                  # File storage
│   │   ├── __init__.py
│   │   ├── image_storage.py
│   │   └── uploads/
│   │
│   └── 📂 core/                     # Core AI engine
│       ├── __init__.py
│       └── disease_detector.py      # Renamed from "Leaf Disease/main.py"
│
├── 📂 frontend/                     # Frontend application
│   ├── 📄 index.html
│   ├── 📄 login.html
│   ├── 📄 register.html
│   ├── 📄 dashboard.html
│   ├── 📄 history.html
│   ├── 📄 README.md
│   │
│   └── 📂 js/
│       ├── auth.js
│       ├── dashboard.js
│       ├── history.js
│       └── validation.js
│
├── 📂 scripts/                      # Utility scripts
│   ├── __init__.py
│   ├── create_admin.py
│   └── setup.py                     # Moved from root
│
├── 📂 tests/                        # Test files
│   ├── __init__.py
│   ├── test_api.py
│   ├── test_auth.py
│   └── test_perplexity.py
│
├── 📂 docs/                         # Documentation
│   ├── 📄 README.md                 # Docs index
│   │
│   ├── 📂 setup/                    # Setup guides
│   │   ├── QUICKSTART.md
│   │   ├── INSTALLATION.md
│   │   ├── COMPLETE_SETUP.md
│   │   ├── FINAL_SETUP.md
│   │   └── SETUP_COMPLETE.md
│   │
│   ├── 📂 features/                 # Feature documentation
│   │   ├── AUTHENTICATION.md        # Renamed from README_AUTH.md
│   │   ├── FRONTEND_GUIDE.md
│   │   ├── VALIDATION_GUIDE.md
│   │   ├── YOUTUBE_INTEGRATION.md   # Renamed from YOUTUBE_INTEGRATION_GUIDE.md
│   │   └── YOUTUBE_QUICKSTART.md    # Renamed from YOUTUBE_SETUP_QUICKSTART.md
│   │
│   ├── 📂 architecture/             # Architecture docs
│   │   ├── architecture.md
│   │   ├── dfd_level0.mmd
│   │   └── dfd_level1.mmd
│   │
│   ├── 📂 planning/                 # Planning documents
│   │   ├── FEATURE_ENHANCEMENT_PLAN.md
│   │   ├── IMPLEMENTATION_SUMMARY.md
│   │   └── CHANGES.md
│   │
│   └── 📂 media/                    # Documentation images
│       └── (screenshots, diagrams)
│
├── 📂 config/                       # Configuration files
│   ├── .streamlit/
│   │   └── config.toml
│   └── .devcontainer/
│       └── devcontainer.json
│
└── 📂 assets/                       # Static assets
    └── 📂 test-images/              # Renamed from "Media"
        └── (test leaf images)
```

## Migration Steps

1. Create new folder structure
2. Move files to appropriate locations
3. Update import statements
4. Update documentation references
5. Test all functionality
6. Update .gitignore if needed
7. Commit changes

## Benefits

✅ **Clear Separation**: Source code, docs, tests, and config are separated
✅ **Professional**: Follows Python project best practices
✅ **Scalable**: Easy to add new modules and features
✅ **Maintainable**: Developers can find files quickly
✅ **Standard**: Follows industry conventions (src/, tests/, docs/)
