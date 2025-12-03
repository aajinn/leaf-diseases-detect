# Sample Data Scripts

## Overview
These scripts help you populate the database with sample analytics data for testing the admin dashboard.

## Quick Start

### Windows Users
Simply double-click or run:
```bash
add_sample_data.bat
```

### All Platforms
```bash
python scripts/add_sample_data.py
```

## What Gets Created

The script generates **30 days** of sample data including:

### API Usage Records
- **Groq API calls** for disease detection
  - Various models (llama-4-scout, llama-3.1-70b, llama-3.1-8b)
  - Realistic token counts (800-1500 input, 200-500 output)
  - Accurate cost calculations based on model pricing
  
- **Perplexity API calls** for additional information
  - Sonar and Sonar-Pro models
  - 25% of analyses include Perplexity calls
  - Realistic token usage (500-1000 tokens)

### Analysis Records
- Disease detection results
- Mix of diseased (65%) and healthy (35%) plants
- Various disease types:
  - Apple Scab
  - Black Rot
  - Tomato Blight
  - Grape Rot
  - Corn Rust
  - And more...
- Confidence scores (75-95%)
- Timestamps spread throughout business hours (8 AM - 8 PM)

### Sample Users
The script creates data for 4 demo users:
- alice (user_001)
- bob (user_002)
- charlie (user_003)
- diana (user_004)

### Growth Trend
Data includes a realistic growth pattern:
- Starts with 3-8 analyses per day
- Gradually increases over the 30-day period
- Simulates organic user growth

## Sample Data Statistics

After running the script, you'll have approximately:
- **150-250** API usage records
- **120-200** analysis records
- **$0.50-$2.00** in estimated API costs
- **100,000-300,000** total tokens used

## Requirements

### Python Packages
```bash
pip install pymongo python-dotenv
```

### MongoDB
- MongoDB must be running
- Connection details in `.env` file:
  ```
  MONGODB_URL=mongodb://localhost:27017
  MONGODB_DB_NAME=leaf_disease_db
  ```

## Usage Examples

### Basic Usage
```bash
python scripts/add_sample_data.py
```

### Check Before Adding
The script will:
1. Check if data already exists
2. Ask for confirmation if >50 records found
3. Show progress every 10 days
4. Display summary statistics when complete

### Output Example
```
============================================================
  Sample Analytics Data Generator
============================================================

✓ Connected to MongoDB: leaf_disease_db
  Current API usage records: 0

📊 Generating 30 days of sample data...
  ✓ Day 10/30 complete
  ✓ Day 20/30 complete
  ✓ Day 30/30 complete

✅ Sample data added successfully!
   - API usage records: 187
   - Analysis records: 156
   - Total estimated cost: $1.2345

🎉 Visit /admin to view the analytics dashboard!
```

## Viewing the Data

After running the script:

1. Start your application:
   ```bash
   start_app.bat
   # or
   uvicorn src.app:app --reload
   ```

2. Navigate to the admin panel:
   ```
   http://localhost:8000/admin
   ```

3. Login with admin credentials

4. View the Overview tab to see:
   - Usage trends chart
   - API distribution chart
   - Disease detection trends
   - Daily active users
   - Summary statistics

## Advanced Script (Async)

For more control, use the async version:
```bash
python scripts/populate_analytics_data.py
```

This version:
- Uses async MongoDB operations
- More detailed progress reporting
- Additional configuration options
- Better for large datasets

## Troubleshooting

### "MongoDB connection failed"
- Ensure MongoDB is running
- Check `MONGODB_URL` in `.env`
- Verify network connectivity

### "Module not found: pymongo"
```bash
pip install pymongo
```

### "Module not found: dotenv"
```bash
pip install python-dotenv
```

### Data Not Showing in Dashboard
1. Refresh the admin page
2. Check browser console for errors
3. Verify you're logged in as admin
4. Try different time ranges (7/30/90 days)

### Want to Reset Data
To clear all sample data:
```javascript
// In MongoDB shell or Compass
db.api_usage.deleteMany({})
db.analysis_records.deleteMany({})
```

## Customization

You can modify `scripts/add_sample_data.py` to:
- Change the number of days
- Adjust daily activity levels
- Add more users
- Include different disease types
- Modify cost calculations
- Change API usage patterns

### Example: Generate 90 Days
```python
# In add_sample_data.py, change:
for day in range(30):  # Change to 90
```

### Example: More Activity
```python
# Change daily count:
daily_count = random.randint(10, 20)  # Instead of 3-8
```

## Best Practices

1. **Run once**: The script is designed to add data, not replace it
2. **Check first**: Script warns if data exists
3. **Test environment**: Use on development/test databases
4. **Backup**: Backup production data before running
5. **Review**: Check the generated data makes sense for your use case

## Integration with CI/CD

Add to your test setup:
```bash
# In your test script
python scripts/add_sample_data.py
pytest tests/
```

## Support

For issues:
1. Check MongoDB is running: `mongosh` or MongoDB Compass
2. Verify `.env` configuration
3. Check Python version: `python --version` (3.7+)
4. Review script output for specific errors

## Related Documentation

- [Analytics Dashboard Documentation](../docs/features/ANALYTICS_TRENDS.md)
- [Analytics Implementation Guide](../ANALYTICS_IMPLEMENTATION.md)
- [Analytics Quick Start](../ANALYTICS_QUICKSTART.md)
