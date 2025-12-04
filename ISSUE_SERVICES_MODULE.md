# Issue: ModuleNotFoundError - No module named 'services'

## 🐛 Bug Report

### Issue ID
`#001` - ModuleNotFoundError when starting application

### Severity
🔴 **Critical** - Application fails to start

### Status
🔧 **In Progress** - Fix identified and ready to implement

---

## Description

The application fails to start with a `ModuleNotFoundError` when trying to import the `AnalyticsService` from the `services` module.

### Error Message
```
ModuleNotFoundError: No module named 'services'
```

### Full Stack Trace
```python
File "C:\Projects\MAIN PROJECT\leaf-diseases-detect\src\app.py", line 11, in <module>
    from src.routes.admin import router as admin_router
File "C:\Projects\MAIN PROJECT\leaf-diseases-detect\src\routes\admin.py", line 22, in <module>
    from services.analytics_service import AnalyticsService
ModuleNotFoundError: No module named 'services'
```

---

## Root Cause Analysis

### Problem
The `services` directory was created outside the `src` package structure, but the import statement in `src/routes/admin.py` is trying to import it as a top-level module without the `src.` prefix.

### Current Structure (Incorrect)
```
leaf-diseases-detect/
├── src/
│   ├── app.py
│   ├── routes/
│   │   └── admin.py  # imports: from services.analytics_service import ...
│   └── ...
└── services/  # ❌ Outside src package
    └── analytics_service.py
```

### Why It Fails
1. Python's module resolution looks for `services` in:
   - Current directory
   - PYTHONPATH
   - Site-packages
2. The `services` folder exists but isn't in any of these locations
3. The import path doesn't match the actual file structure

---

## Impact

- ❌ Application cannot start
- ❌ All analytics endpoints unavailable
- ❌ Admin dashboard non-functional
- ❌ Blocks development and testing

---

## Reproduction Steps

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run the application: `uvicorn src.app:app --reload`
4. Observe the `ModuleNotFoundError`

### Environment
- **OS**: Windows 11
- **Python Version**: 3.13
- **Uvicorn Version**: Latest
- **Project Structure**: Mixed (services outside src)

---

## Solution Options

### ✅ Option 1: Move services into src package (RECOMMENDED)

**Pros:**
- Follows Python package conventions
- Consistent with existing structure
- No import path changes needed elsewhere
- Clean and maintainable

**Cons:**
- Requires moving files
- Need to update git history

**Implementation:**
```bash
# Move services into src
mkdir src/services
move services/analytics_service.py src/services/
rmdir services

# Update import in admin.py
# from services.analytics_service import AnalyticsService
# to
# from src.services.analytics_service import AnalyticsService
```

### Option 2: Add services to PYTHONPATH

**Pros:**
- No file movement needed
- Quick fix

**Cons:**
- Environment-specific configuration
- Not portable
- Requires setup on every machine
- Not recommended for production

### Option 3: Use relative imports

**Pros:**
- Works with current structure

**Cons:**
- Requires complex relative paths
- Less readable
- Harder to maintain

---

## Recommended Fix

### Step 1: Create proper package structure

```bash
# Create src/services directory
mkdir src/services

# Create __init__.py to make it a package
echo "" > src/services/__init__.py
```

### Step 2: Move analytics_service.py

```bash
# Move the file
move services/analytics_service.py src/services/

# Remove old directory
rmdir services
```

### Step 3: Update import statement

In `src/routes/admin.py`, change:
```python
from services.analytics_service import AnalyticsService
```

To:
```python
from src.services.analytics_service import AnalyticsService
```

### Step 4: Verify the fix

```bash
# Test the application starts
uvicorn src.app:app --reload

# Should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

---

## Implementation Checklist

- [ ] Create `src/services/` directory
- [ ] Create `src/services/__init__.py`
- [ ] Move `analytics_service.py` to `src/services/`
- [ ] Update import in `src/routes/admin.py`
- [ ] Test application startup
- [ ] Test analytics endpoints
- [ ] Update documentation
- [ ] Commit changes with proper message
- [ ] Update any related imports if needed

---

## Testing Plan

### Unit Tests
```python
# Test import works
def test_analytics_service_import():
    from src.services.analytics_service import AnalyticsService
    assert AnalyticsService is not None

# Test service methods exist
def test_analytics_service_methods():
    from src.services.analytics_service import AnalyticsService
    assert hasattr(AnalyticsService, 'get_trends')
    assert hasattr(AnalyticsService, 'get_user_activity_trends')
    assert hasattr(AnalyticsService, 'get_cost_breakdown')
```

### Integration Tests
1. Start application: `uvicorn src.app:app --reload`
2. Access admin dashboard: `http://localhost:8000/admin`
3. Verify analytics endpoints respond:
   - GET `/admin/analytics/trends?days=30`
   - GET `/admin/analytics/user-activity?days=30`
   - GET `/admin/analytics/cost-breakdown?days=30`

### Manual Testing
- [ ] Application starts without errors
- [ ] Admin dashboard loads
- [ ] Analytics charts render
- [ ] No console errors
- [ ] All endpoints return data

---

## Prevention

### Best Practices to Avoid This Issue

1. **Follow Python Package Structure**
   ```
   project/
   ├── src/
   │   ├── __init__.py
   │   ├── module1/
   │   │   └── __init__.py
   │   └── module2/
   │       └── __init__.py
   └── tests/
   ```

2. **Use Consistent Import Paths**
   - Always use absolute imports from project root
   - Example: `from src.services.analytics_service import ...`

3. **Add __init__.py Files**
   - Every directory that should be a package needs `__init__.py`
   - Even if empty, it marks the directory as a Python package

4. **Test Imports Early**
   - Run application after creating new modules
   - Catch import errors immediately

5. **Use IDE Features**
   - Modern IDEs (PyCharm, VS Code) warn about import issues
   - Enable Python linting (pylint, flake8)

---

## Related Issues

- None (first occurrence)

## References

- [Python Modules Documentation](https://docs.python.org/3/tutorial/modules.html)
- [Python Package Structure Best Practices](https://docs.python-guide.org/writing/structure/)
- [PEP 8 - Import Conventions](https://peps.python.org/pep-0008/#imports)

---

## Timeline

- **Discovered**: 2024-12-04
- **Reported**: 2024-12-04
- **Fix Identified**: 2024-12-04
- **Target Resolution**: 2024-12-04 (Same day)
- **Priority**: P0 (Critical)

---

## Assignee

- Developer: @team
- Reviewer: @lead
- Tester: @qa

---

## Labels

`bug` `critical` `python` `imports` `module-structure` `quick-fix`
