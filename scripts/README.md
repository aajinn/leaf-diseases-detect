# Scripts Directory

Utility scripts for development, testing, and data management.

---

## 🚀 CI/CD Pre-Push Checks

**Run all CI checks locally before pushing to catch issues early!**

### Windows (PowerShell)
```powershell
.\scripts\run-ci-checks.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x scripts/run-ci-checks.sh
./scripts/run-ci-checks.sh
```

### What It Checks
1. ✅ Black code formatting
2. ✅ isort import sorting
3. ✅ Flake8 critical errors
4. ✅ Flake8 style warnings
5. ✅ Pytest test suite
6. ✅ FastAPI import verification

If all checks pass, you're safe to push! 🚀

### Quick Fixes

If checks fail, run these commands to auto-fix:

```bash
# Format code with Black
black . --exclude '/(\.git|\.venv|venv|__pycache__|node_modules|build|dist)/' --extend-exclude 'Leaf Disease'

# Sort imports with isort
isort . --skip-gitignore --extend-skip 'Leaf Disease'
```

---

## 📋 Prescription Data Scripts

Scripts for managing prescription sample data for testing and development.

## Quick Start

### Add Sample Prescriptions

The easiest way to add sample data:

```bash
python scripts/add_sample_prescriptions.py
```

This will:
- Generate 50 sample prescriptions
- Distribute them across 5 sample users
- Cover 8 different diseases
- Span the last 30 days
- Include various priorities and statuses
- Show statistics after completion

**Output Example:**
```
🌱 PRESCRIPTION SAMPLE DATA GENERATOR
====================================

Generating prescriptions...
  ✓ 10/50 prescriptions created
  ✓ 20/50 prescriptions created
  ✓ 30/50 prescriptions created
  ✓ 40/50 prescriptions created
  ✓ 50/50 prescriptions created

✅ Successfully generated 50 prescriptions!

📊 DATABASE STATISTICS
  Total prescriptions: 50
  
  By Priority:
    • moderate: 20
    • high: 15
    • urgent: 10
    • low: 5
```

## Advanced Usage

### Seed Prescription Data (Advanced)

For more control over the data generation:

```bash
# Generate 50 prescriptions (default)
python scripts/seed_prescription_data.py generate

# Generate custom number
python scripts/seed_prescription_data.py generate --count 100

# Show current statistics
python scripts/seed_prescription_data.py stats

# Clear all prescription data (DANGEROUS!)
python scripts/seed_prescription_data.py clear
```

## Sample Data Details

### Users (5 sample users)
- farmer_raj
- agri_priya
- farm_kumar
- green_thumb
- crop_master

### Diseases (8 types)
- Bacterial Blight (bacterial, severe)
- Fungal Leaf Spot (fungal, moderate)
- Powdery Mildew (fungal, mild)
- Leaf Rust (fungal, moderate)
- Bacterial Wilt (bacterial, severe)
- Early Blight (fungal, moderate)
- Late Blight (fungal, severe)
- Anthracnose (fungal, moderate)

### Priorities (weighted distribution)
- Urgent: 20%
- High: 30%
- Moderate: 40%
- Low: 10%

### Statuses (weighted distribution)
- Active: 70%
- Completed: 20%
- Expired: 10%

### Date Range
- Created: Random dates within last 30 days
- Expires: 90 days after creation

## Viewing the Data

After generating sample data:

1. **Admin Dashboard**
   - Navigate to `/admin`
   - Click on "Prescriptions" tab
   - View analytics and charts

2. **User Prescriptions**
   - Login as any user
   - Navigate to `/prescriptions`
   - View prescription list

## Troubleshooting

### "Module not found" error
Make sure you're running from the project root:
```bash
cd /path/to/leaf-diseases-detect
python scripts/add_sample_prescriptions.py
```

### Database connection error
1. Check MongoDB is running
2. Verify `.env` file has correct `MONGODB_URL`
3. Ensure database name is correct

### No data showing in admin
1. Refresh the admin page
2. Check browser console for errors
3. Verify prescriptions were created:
   ```bash
   python scripts/seed_prescription_data.py stats
   ```

## Cleaning Up

To remove all prescription data:

```bash
python scripts/seed_prescription_data.py clear
```

**⚠️ WARNING**: This will delete ALL prescriptions, including real user data!

## Development

### Adding More Sample Data

Edit `add_sample_prescriptions.py` to customize:

```python
# Add more users
users = [
    {"id": "user6", "username": "new_farmer"},
    # ... more users
]

# Add more diseases
diseases = [
    {"name": "New Disease", "type": "fungal", "severity": "moderate"},
    # ... more diseases
]

# Change count
count = 100  # Generate 100 prescriptions
```

### Testing Analytics

1. Generate sample data
2. Open admin dashboard
3. Check "Prescriptions" tab
4. Verify all charts display correctly
5. Test different time ranges

## Notes

- Sample data uses fake user IDs
- Analysis IDs are generated as `sample_analysis_{i}_{timestamp}`
- Prescription IDs follow normal format: `RX-YYYYMMDD-XXXXXXXX`
- All prescriptions have full product recommendations and treatment steps
- Purchase links are generated for each product

## Support

If you encounter issues:
1. Check MongoDB connection
2. Verify all dependencies are installed
3. Check server logs for errors
4. Ensure prescription service is working correctly
