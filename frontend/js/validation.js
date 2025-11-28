// Form Validation Functions

/**
 * Validate email format
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate username
 * - 3-50 characters
 * - Only letters, numbers, hyphens, underscores
 */
function validateUsername(username) {
    if (username.length < 3) {
        return { valid: false, message: 'Username must be at least 3 characters long' };
    }
    if (username.length > 50) {
        return { valid: false, message: 'Username must be less than 50 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { valid: false, message: 'Username can only contain letters, numbers, hyphens, and underscores' };
    }
    return { valid: true };
}

/**
 * Validate password strength
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (password.length > 72) {
        return { valid: false, message: 'Password must be less than 72 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
}

/**
 * Calculate password strength
 * Returns: weak, medium, strong
 */
function getPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
}

/**
 * Validate full name
 */
function validateFullName(name) {
    if (name && name.length > 100) {
        return { valid: false, message: 'Full name must be less than 100 characters' };
    }
    return { valid: true };
}

/**
 * Validate file upload
 */
function validateImageFile(file) {
    // Check if file exists
    if (!file) {
        return { valid: false, message: 'Please select a file' };
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
        return { valid: false, message: 'Invalid file type. Please upload JPG, PNG, WebP, BMP, or TIFF images' };
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        return { valid: false, message: 'File size must be less than 10MB' };
    }
    
    return { valid: true };
}

/**
 * Show validation error on input field
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error styling
    field.classList.add('border-red-500');
    field.classList.remove('border-gray-300');
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message text-red-600 text-sm mt-1';
    errorDiv.textContent = message;
    field.parentElement.appendChild(errorDiv);
}

/**
 * Clear validation error from input field
 */
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove error message
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Remove error styling
    field.classList.remove('border-red-500');
    field.classList.add('border-gray-300');
}

/**
 * Add real-time validation to a field
 */
function addFieldValidation(fieldId, validationFn) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.addEventListener('blur', () => {
        const result = validationFn(field.value);
        if (!result.valid) {
            showFieldError(fieldId, result.message);
        } else {
            clearFieldError(fieldId);
        }
    });
    
    field.addEventListener('input', () => {
        // Clear error on input
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            clearFieldError(fieldId);
        }
    });
}

/**
 * Show password strength indicator
 */
function showPasswordStrength(passwordFieldId, indicatorId) {
    const passwordField = document.getElementById(passwordFieldId);
    const indicator = document.getElementById(indicatorId);
    
    if (!passwordField || !indicator) return;
    
    passwordField.addEventListener('input', () => {
        const password = passwordField.value;
        
        if (password.length === 0) {
            indicator.innerHTML = '';
            return;
        }
        
        const strength = getPasswordStrength(password);
        let color, text;
        
        switch (strength) {
            case 'weak':
                color = 'red';
                text = 'Weak';
                break;
            case 'medium':
                color = 'yellow';
                text = 'Medium';
                break;
            case 'strong':
                color = 'green';
                text = 'Strong';
                break;
        }
        
        indicator.innerHTML = `
            <div class="flex items-center space-x-2 mt-2">
                <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-${color}-500 transition-all" style="width: ${strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%'}"></div>
                </div>
                <span class="text-sm font-semibold text-${color}-600">${text}</span>
            </div>
        `;
    });
}
