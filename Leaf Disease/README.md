# ⚠️ DEPRECATED - Legacy Location

This directory contains legacy code that has been moved to the proper location.

## Current Location

The disease detection engine is now located at:
```
src/core/disease_detector.py
```

## Migration

All imports and references should use:
```python
from src.core.disease_detector import LeafDiseaseDetector
```

## Why This Change?

This reorganization follows Python best practices:
- Proper package structure with `src/` directory
- Consistent import paths
- Better IDE support and tooling
- Clearer project organization

## Files

- `main.py` - **DEPRECATED**: Use `src/core/disease_detector.py` instead
- `config.py` - Configuration (if needed, should be in `src/core/`)

## Timeline

- This directory will be removed in a future release
- All documentation has been updated to reference the new location
- Please update any custom scripts or integrations

---

**See**: [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) for the current project structure
