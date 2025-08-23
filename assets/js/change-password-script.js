// Change Password functionality
document.addEventListener('DOMContentLoaded', function() {
    initializePasswordForm();
    setupPasswordValidation();
    setupPasswordToggle();
});

function initializePasswordForm() {
    const form = document.querySelector('form');
    if (form) {
        // Add enhanced form classes
        form.classList.add('password-form');
        
        // Add password requirements section
        addPasswordRequirements();
        
        // Setup form submission
        form.addEventListener('submit', handlePasswordChange);
        
        // Add password strength indicator
        const newPasswordInput = form.querySelectorAll('input[type="password"]')[1];
        if (newPasswordInput) {
            addPasswordStrengthIndicator(newPasswordInput);
        }
    }
}

function addPasswordRequirements() {
    const form = document.querySelector('form');
    const requirementsHTML = `
        <div class="password-requirements">
            <h4>Password Requirements:</h4>
            <ul class="requirements-list">
                <li id="length">At least 8 characters</li>
                <li id="uppercase">One uppercase letter</li>
                <li id="lowercase">One lowercase letter</li>
                <li id="number">One number</li>
                <li id="special">One special character</li>
            </ul>
        </div>
    `;
    
    const newPasswordGroup = form.querySelectorAll('.form-group')[1] || form.querySelectorAll('div')[1];
    if (newPasswordGroup) {
        newPasswordGroup.insertAdjacentHTML('afterend', requirementsHTML);
    }
}

function addPasswordStrengthIndicator(input) {
    const strengthHTML = `
        <div class="password-strength">
            <div class="strength-bar"></div>
        </div>
        <div class="strength-text"></div>
    `;
    
    input.parentNode.insertAdjacentHTML('beforeend', strengthHTML);
    
    input.addEventListener('input', function() {
        updatePasswordStrength(this.value);
        validatePasswordRequirements(this.value);
    });
}

function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    const strengthContainer = document.querySelector('.password-strength');
    
    if (!password) {
        strengthContainer.classList.remove('show');
        return;
    }
    
    strengthContainer.classList.add('show');
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Update strength bar and text
    strengthBar.className = 'strength-bar';
    
    if (score < 3) {
        strengthBar.classList.add('weak');
        strengthText.textContent = 'Weak password';
        strengthText.style.color = '#e53e3e';
    } else if (score < 5) {
        strengthBar.classList.add('medium');
        strengthText.textContent = 'Medium strength';
        strengthText.style.color = '#ed8936';
    } else {
        strengthBar.classList.add('strong');
        strengthText.textContent = 'Strong password';
        strengthText.style.color = '#38a169';
    }
}

function validatePasswordRequirements(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
    
    Object.keys(requirements).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (requirements[key]) {
                element.classList.add('valid');
            } else {
                element.classList.remove('valid');
            }
        }
    });
}

function setupPasswordValidation() {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input[type="password"]');
    
    // Real-time validation
    inputs.forEach((input, index) => {
        input.addEventListener('blur', function() {
            validatePasswordField(this, index);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
    
    // Confirm password matching
    if (inputs.length >= 3) {
        inputs[2].addEventListener('input', function() {
            validatePasswordMatch(inputs[1].value, this.value);
        });
    }
}

function validatePasswordField(input, index) {
    const value = input.value;
    let isValid = true;
    let errorMessage = '';
    
    if (!value) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (index === 1 && value.length < 8) { // New password
        isValid = false;
        errorMessage = 'Password must be at least 8 characters';
    } else if (index === 2 && value !== input.parentNode.parentNode.querySelectorAll('input[type="password"]')[1].value) { // Confirm password
        isValid = false;
        errorMessage = 'Passwords do not match';
    }
    
    if (!isValid) {
        showFieldError(input, errorMessage);
    } else {
        clearFieldError(input);
    }
    
    return isValid;
}

function validatePasswordMatch(password, confirmPassword) {
    const confirmInput = document.querySelectorAll('input[type="password"]')[2];
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError(confirmInput, 'Passwords do not match');
    } else if (confirmPassword) {
        clearFieldError(confirmInput);
    }
}

function showFieldError(input, message) {
    clearFieldError(input);
    
    input.style.borderColor = '#e53e3e';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = `
        color: #e53e3e;
        font-size: 0.75rem;
        margin-top: 0.25rem;
        display: block;
    `;
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
}

function clearFieldError(input) {
    input.style.borderColor = '#e2e8f0';
    const errorDiv = input.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function setupPasswordToggle() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'password-toggle';
        toggle.textContent = 'Show';
        
        toggle.addEventListener('click', function() {
            if (input.type === 'password') {
                input.type = 'text';
                toggle.textContent = 'Hide';
            } else {
                input.type = 'password';
                toggle.textContent = 'Show';
            }
        });
        
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(toggle);
    });
}

function handlePasswordChange(e) {
    e.preventDefault();
    
    const form = e.target;
    const inputs = form.querySelectorAll('input[type="password"], input[type="text"]');
    const currentPassword = inputs[0].value;
    const newPassword = inputs[1].value;
    const confirmPassword = inputs[2].value;
    
    // Clear previous messages
    clearMessage();
    
    // Validate form
    const errors = validatePasswordChangeForm(currentPassword, newPassword, confirmPassword);
    if (errors.length > 0) {
        showMessage(errors.join('. '), 'error');
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    setLoadingState(submitButton, true);
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Check current password (in real app, this would be verified server-side)
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            
            // Simulate password verification (in production, never store plain text passwords)
            if (currentPassword !== 'currentPass123') {
                // For demo, we'll accept any current password
            }
            
            // Update password (in real app, this would be done server-side)
            currentUser.passwordUpdated = new Date().toISOString();
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showMessage('Password updated successfully!', 'success');
            form.reset();
            clearPasswordStrength();
            
        } catch (error) {
            showMessage('An error occurred. Please try again.', 'error');
        } finally {
            setLoadingState(submitButton, false);
        }
    }, 2000);
}

function validatePasswordChangeForm(currentPassword, newPassword, confirmPassword) {
    const errors = [];
    
    if (!currentPassword) errors.push('Current password is required');
    if (!newPassword) errors.push('New password is required');
    if (!confirmPassword) errors.push('Please confirm your new password');
    
    if (newPassword) {
        if (newPassword.length < 8) errors.push('New password must be at least 8 characters');
        if (!/[A-Z]/.test(newPassword)) errors.push('New password must contain at least one uppercase letter');
        if (!/[a-z]/.test(newPassword)) errors.push('New password must contain at least one lowercase letter');
        if (!/[0-9]/.test(newPassword)) errors.push('New password must contain at least one number');
        if (!/[^A-Za-z0-9]/.test(newPassword)) errors.push('New password must contain at least one special character');
    }
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        errors.push('New password and confirmation do not match');
    }
    
    if (currentPassword && newPassword && currentPassword === newPassword) {
        errors.push('New password must be different from current password');
    }
    
    return errors;
}

function showMessage(text, type) {
    clearMessage();
    
    const form = document.querySelector('form');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    
    form.insertBefore(messageDiv, form.firstChild);
    
    // Auto-remove success messages
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

function clearMessage() {
    const message = document.querySelector('.message');
    if (message) {
        message.remove();
    }
}

function clearPasswordStrength() {
    const strengthContainer = document.querySelector('.password-strength');
    const strengthText = document.querySelector('.strength-text');
    
    if (strengthContainer) {
        strengthContainer.classList.remove('show');
    }
    if (strengthText) {
        strengthText.textContent = '';
    }
    
    // Clear requirement validations
    document.querySelectorAll('.requirements-list li').forEach(li => {
        li.classList.remove('valid');
    });
}

function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        button.originalText = button.textContent;
        button.textContent = 'Updating Password...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = button.originalText || 'Update Password';
    }
}