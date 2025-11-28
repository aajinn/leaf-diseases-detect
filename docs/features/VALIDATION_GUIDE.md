# Validation Guide

## Overview

Comprehensive validation has been added to both frontend and backend to ensure data integrity and security.

## Backend Validation (API)

### User Registration Validation

**Username:**
- Minimum 3 characters
- Maximum 50 characters
- Only letters, numbers, hyphens, and underscores
- Case-insensitive (stored in lowercase)
- Must be unique

**Email:**
- Valid email format
- Case-insensitive (stored in lowercase)
- Must be unique

**Password:**
- Minimum 8 characters
- Maximum 72 characters (bcrypt limit)
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Hashed with bcrypt before storage

**Full Name:**
- Optional field
- Maximum 100 characters

### Image Upload Validation

**File Type:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- BMP (.bmp)
- TIFF (.tiff)

**File Size:**
- Maximum 10MB per image

### Implementation

```python
# In database/models.py
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72)
    
    @classmethod
    def validate_password(cls, password: str) -> str:
        # Password strength validation
        ...
```

```python
# In auth/routes.py
@router.post("/register")
async def register_user(user: UserCreate):
    # Validate password strength
    UserCreate.validate_password(user.password)
    
    # Check uniqueness
    # Hash password
    # Store user
```

## Frontend Validation (JavaScript)

### Real-time Validation

All form fields have real-time validation:

**Email Field:**
- Validates on blur
- Shows error if invalid format
- Clears error on input

**Username Field:**
- Validates length (3-50 chars)
- Validates format (alphanumeric, hyphens, underscores)
- Shows error immediately

**Password Field:**
- Shows strength indicator (weak/medium/strong)
- Validates requirements
- Updates in real-time

**Confirm Password:**
- Validates match with password
- Shows error if mismatch

### Validation Functions

Located in `frontend/js/validation.js`:

```javascript
// Email validation
validateEmail(email) // Returns boolean

// Username validation
validateUsername(username) // Returns {valid, message}

// Password validation
validatePassword(password) // Returns {valid, message}

// Password strength
getPasswordStrength(password) // Returns 'weak'|'medium'|'strong'

// Image file validation
validateImageFile(file) // Returns {valid, message}
```

### Usage Example

```javascript
// Add validation to a field
addFieldValidation('email', (value) => {
    if (!validateEmail(value)) {
        return { valid: false, message: 'Invalid email' };
    }
    return { valid: true };
});

// Show password strength
showPasswordStrength('password', 'strengthIndicator');

// Validate file upload
const validation = validateImageFile(file);
if (!validation.valid) {
    alert(validation.message);
}
```

## Validation Rules Summary

### Username
✅ 3-50 characters  
✅ Letters, numbers, hyphens, underscores only  
✅ Case-insensitive  
✅ Must be unique  

### Email
✅ Valid email format  
✅ Case-insensitive  
✅ Must be unique  

### Password
✅ 8-72 characters  
✅ At least one uppercase letter  
✅ At least one lowercase letter  
✅ At least one number  
✅ Strength indicator (weak/medium/strong)  

### Image Upload
✅ Valid image format (JPG, PNG, WebP, BMP, TIFF)  
✅ Maximum 10MB file size  
✅ File type validation  

## Error Messages

### Backend Error Responses

```json
{
    "detail": "Username already registered"
}
```

```json
{
    "detail": "Password must contain at least one uppercase letter"
}
```

### Frontend Error Display

- **Inline errors**: Shown below input fields
- **Form-level errors**: Shown in message box
- **Color coding**: Red for errors, green for success
- **Icons**: Visual indicators for error states

## Security Features

1. **Password Hashing**: bcrypt with salt
2. **Case-insensitive Matching**: Prevents duplicate accounts
3. **Input Sanitization**: Trim whitespace, validate format
4. **File Type Validation**: Prevent malicious uploads
5. **Size Limits**: Prevent DoS attacks
6. **SQL Injection Prevention**: MongoDB with parameterized queries
7. **XSS Prevention**: Input validation and sanitization

## Testing Validation

### Test Invalid Username
```javascript
// Too short
validateUsername('ab') // {valid: false, message: '...'}

// Invalid characters
validateUsername('user@name') // {valid: false, message: '...'}

// Valid
validateUsername('user_name') // {valid: true}
```

### Test Invalid Password
```javascript
// Too short
validatePassword('Pass1') // {valid: false, message: '...'}

// No uppercase
validatePassword('password1') // {valid: false, message: '...'}

// Valid
validatePassword('Password123') // {valid: true}
```

### Test Invalid Email
```javascript
validateEmail('invalid') // false
validateEmail('user@example.com') // true
```

### Test Invalid File
```javascript
// Wrong type
validateImageFile(pdfFile) // {valid: false, message: '...'}

// Too large
validateImageFile(largeFile) // {valid: false, message: '...'}

// Valid
validateImageFile(imageFile) // {valid: true}
```

## Customization

### Change Password Requirements

Edit `frontend/js/validation.js`:

```javascript
function validatePassword(password) {
    // Add custom rules
    if (!/[!@#$%^&*]/.test(password)) {
        return { valid: false, message: 'Must contain special character' };
    }
    // ...
}
```

Edit `database/models.py`:

```python
@classmethod
def validate_password(cls, password: str) -> str:
    # Add custom rules
    if not any(c in '!@#$%^&*' for c in password):
        raise ValueError("Password must contain special character")
    # ...
```

### Change File Size Limit

Edit `frontend/js/validation.js`:

```javascript
const maxSize = 20 * 1024 * 1024; // 20MB
```

Edit backend validation in `routes/disease_detection.py`:

```python
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
```

## Best Practices

1. **Validate on both frontend and backend**
   - Frontend: Better UX
   - Backend: Security

2. **Show clear error messages**
   - Tell users what's wrong
   - Tell users how to fix it

3. **Validate in real-time**
   - On blur for better UX
   - On submit for final check

4. **Use visual indicators**
   - Red borders for errors
   - Green checkmarks for valid
   - Strength meters for passwords

5. **Sanitize inputs**
   - Trim whitespace
   - Convert to lowercase where appropriate
   - Remove dangerous characters

## Troubleshooting

### Validation not working
- Check if validation.js is loaded
- Check browser console for errors
- Verify field IDs match

### Password strength not showing
- Check if indicator element exists
- Verify showPasswordStrength is called
- Check CSS classes are applied

### Backend validation failing
- Check Pydantic models
- Verify Field constraints
- Check custom validators

## Future Enhancements

- [ ] Email verification
- [ ] Phone number validation
- [ ] Address validation
- [ ] Credit card validation
- [ ] Custom regex patterns
- [ ] Async username availability check
- [ ] Password strength requirements config
- [ ] Multi-language error messages
- [ ] Accessibility improvements
- [ ] Rate limiting validation

---

**Validation is now fully implemented!** Both frontend and backend validate all user inputs for security and data integrity.
