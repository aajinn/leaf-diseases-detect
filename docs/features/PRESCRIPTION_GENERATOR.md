# Prescription Generator Feature

## Overview

The Prescription Generator automatically creates comprehensive, printable treatment plans based on disease detection results. Each prescription includes detailed product recommendations, step-by-step treatment instructions, and monitoring guidelines.

## Features

### 1. Automatic Generation
- Prescriptions are automatically generated when a disease is detected
- Each prescription gets a unique ID (format: `RX-YYYYMMDD-XXXXXXXX`)
- Valid for 90 days from issue date

### 2. Disease-Specific Protocols
Pre-configured treatment protocols for:
- **Bacterial Blight**: Urgent priority, 2-3 week treatment
- **Fungal Leaf Spot**: Moderate priority, 2-4 week treatment
- **Healthy Plants**: Maintenance recommendations

### 3. Severity-Based Adjustments
Treatment intensity automatically adjusts based on disease severity:
- **Severe/Critical**: Increased treatment frequency, urgent priority
- **Moderate**: Standard protocol
- **Mild/Low**: Reduced treatment intensity

### 4. Comprehensive Treatment Plans

Each prescription includes:

#### Product Recommendations
- Product name and type (fungicide, bactericide, organic, etc.)
- Active ingredients
- Dosage instructions
- Application method and frequency
- Safety precautions
- Estimated cost

#### Treatment Steps
- Step-by-step instructions
- Timing for each step
- Products needed
- Estimated duration

#### Additional Guidance
- Prevention tips
- Monitoring schedule
- Warning signs to watch for
- Success indicators

## API Endpoints

### Generate Prescription
```http
POST /api/prescriptions/generate
Authorization: Bearer <token>

{
  "analysis_id": "string",
  "disease_name": "string",
  "disease_type": "string",
  "severity": "string",
  "confidence": 0.95
}
```

### Get User Prescriptions
```http
GET /api/prescriptions/my-prescriptions?limit=10&skip=0
Authorization: Bearer <token>
```

### Get Specific Prescription
```http
GET /api/prescriptions/{prescription_id}
Authorization: Bearer <token>
```

### Get Printable Format
```http
GET /api/prescriptions/{prescription_id}/print
Authorization: Bearer <token>
```

## Frontend Interface

### Prescriptions Page (`/prescriptions`)

Features:
- List view of all user prescriptions
- Priority badges (urgent, high, moderate, low)
- Quick info: disease, severity, duration, date
- Click to view full details

### Prescription Detail Modal

Displays:
- Header with prescription ID, patient name, dates
- Diagnosis information
- Complete treatment plan with numbered steps
- Product recommendations with safety info
- Prevention tips and monitoring schedule
- Warning signs and success indicators
- Print button for physical copies

### Print Functionality

- Optimized print layout
- Professional formatting
- Includes all essential information
- Disclaimer and status footer

## Database Schema

### Prescription Collection

```python
{
  "_id": ObjectId,
  "prescription_id": "RX-20241204-abc12345",
  "user_id": "string",
  "username": "string",
  "analysis_id": "string",
  
  # Disease info
  "disease_name": "string",
  "disease_type": "string",
  "severity": "string",
  "confidence": 0.95,
  
  # Treatment plan
  "treatment_priority": "urgent|high|moderate|low",
  "treatment_duration": "string",
  "treatment_steps": [...],
  "product_recommendations": [...],
  
  # Guidance
  "prevention_tips": [...],
  "monitoring_schedule": [...],
  "warning_signs": [...],
  "success_indicators": [...],
  
  # Metadata
  "created_at": ISODate,
  "expires_at": ISODate,
  "status": "active|completed|expired",
  "notes": "string"
}
```

## Usage Flow

1. **User uploads leaf image** → Disease detection runs
2. **Disease detected** → Prescription automatically generated
3. **User navigates to Prescriptions page** → Views all prescriptions
4. **User clicks prescription** → Opens detailed view
5. **User clicks Print** → Generates printable format

## Integration Points

### Disease Detection Route
- Automatically calls `PrescriptionService.generate_prescription()` after successful detection
- Links prescription to analysis record via `analysis_id`

### Dashboard Navigation
- Added "Prescriptions" link to main navigation
- Accessible from all authenticated pages

## Customization

### Adding New Disease Protocols

Edit `src/services/prescription_service.py`:

```python
TREATMENT_PROTOCOLS = {
    "new_disease": {
        "priority": "moderate",
        "duration": "2-3 weeks",
        "products": [...],
        "steps": [...],
        "prevention_tips": [...],
        "monitoring_schedule": [...],
        "warning_signs": [...],
        "success_indicators": [...]
    }
}
```

### Adjusting Severity Logic

Modify `_adjust_for_severity()` method to customize how treatment intensity changes based on severity levels.

## Security

- All endpoints require authentication
- Users can only access their own prescriptions
- Prescription ownership verified on every request
- No sensitive medical data stored

## Future Enhancements

Potential additions:
- Email prescription to user
- SMS reminders for treatment steps
- Progress tracking and completion status
- Prescription history and comparison
- Export to PDF format
- Integration with agricultural supply stores
- Multi-language support
- Custom prescription templates
- Veterinary/agricultural professional review system

## Testing

Test the feature:
1. Upload a diseased leaf image
2. Check that prescription is auto-generated
3. Navigate to `/prescriptions`
4. Click on a prescription to view details
5. Test print functionality
6. Verify all data displays correctly

## Troubleshooting

**Prescription not generating:**
- Check logs for errors in `PrescriptionService.generate_prescription()`
- Verify disease name matches protocol keys
- Ensure MongoDB connection is active

**Print layout issues:**
- Check browser print preview
- Verify CSS `@media print` styles
- Test in different browsers

**Missing data:**
- Verify all required fields in detection result
- Check prescription model validation
- Review database schema matches code

## Files Modified/Created

- `src/services/prescription_service.py` - Core service
- `src/database/prescription_models.py` - Data models
- `routes/prescription_routes.py` - API endpoints
- `frontend/prescriptions.html` - UI page
- `src/app.py` - Route registration
- `src/routes/disease_detection.py` - Auto-generation integration
- `frontend/dashboard.html` - Navigation link

## Dependencies

- FastAPI for API routes
- MongoDB for storage
- Pydantic for data validation
- Existing authentication system
- Frontend: Vanilla JavaScript, CSS
