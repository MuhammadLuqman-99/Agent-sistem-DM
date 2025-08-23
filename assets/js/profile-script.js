// Profile management functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize profile data
    loadProfileData();
    
    // Form submission handlers
    setupFormHandlers();
    
    // Validation setup
    setupFormValidation();
});

// Load existing profile data
function loadProfileData() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    // If user data exists, populate form fields
    if (currentUser.name) {
        const nameParts = currentUser.name.split(' ');
        const firstNameInput = document.querySelector('input[value="Maisarah"]');
        const lastNameInput = document.querySelector('input[value="Iman"]');
        
        if (firstNameInput && nameParts[0]) {
            firstNameInput.value = nameParts[0];
        }
        if (lastNameInput && nameParts[1]) {
            lastNameInput.value = nameParts[1];
        }
    }
}

// Setup form submission handlers
function setupFormHandlers() {
    // Personal Information Form
    const personalForm = document.querySelector('.profile-form form');
    if (personalForm) {
        personalForm.addEventListener('submit', handlePersonalInfoSubmit);
    }
    
    // Bank Information Form
    const bankForm = document.querySelector('.bank-form form');
    if (bankForm) {
        bankForm.addEventListener('submit', handleBankInfoSubmit);
    }
}

// Handle personal information form submission
function handlePersonalInfoSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const personalInfo = {
        firstName: formData.get('firstName') || e.target.querySelector('input[type="text"]').value,
        lastName: e.target.querySelectorAll('input[type="text"]')[1].value,
        gender: e.target.querySelector('select').value,
        dateOfBirth: e.target.querySelector('input[type="date"]').value,
        icNumber: e.target.querySelectorAll('input[type="text"]')[2].value,
        phone: e.target.querySelector('input[type="tel"]').value,
        country: e.target.querySelectorAll('input[type="text"]')[3].value,
        state: e.target.querySelectorAll('input[type="text"]')[4].value,
        city: e.target.querySelectorAll('input[type="text"]')[5].value,
        postcode: e.target.querySelectorAll('input[type="text"]')[6].value,
        address1: e.target.querySelectorAll('input[type="text"]')[7].value,
        address2: e.target.querySelectorAll('input[type="text"]')[8].value
    };
    
    // Validate required fields
    const errors = validatePersonalInfo(personalInfo);
    if (errors.length > 0) {
        showFormMessage(personalForm, errors.join('. '), 'error');
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('.save-button');
    setLoadingState(submitButton, true);
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Update user data in session
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            currentUser.personalInfo = personalInfo;
            currentUser.name = `${personalInfo.firstName} ${personalInfo.lastName}`;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showFormMessage(personalForm, 'Personal information updated successfully!', 'success');
            setLoadingState(submitButton, false);
        } catch (error) {
            showFormMessage(personalForm, 'An error occurred. Please try again.', 'error');
            setLoadingState(submitButton, false);
        }
    }, 1500);
}

// Handle bank information form submission
function handleBankInfoSubmit(e) {
    e.preventDefault();
    
    const formData = {
        bankName: e.target.querySelectorAll('input[type="text"]')[0].value,
        accountNumber: e.target.querySelectorAll('input[type="text"]')[1].value,
        accountHolder: e.target.querySelectorAll('input[type="text"]')[2].value,
        confirmation: e.target.querySelector('input[type="checkbox"]').checked
    };
    
    // Validate required fields
    const errors = validateBankInfo(formData);
    if (errors.length > 0) {
        showFormMessage(e.target, errors.join('. '), 'error');
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('.save-button');
    setLoadingState(submitButton, true);
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Update user data in session
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            currentUser.bankInfo = formData;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showFormMessage(e.target, 'Bank information updated successfully!', 'success');
            setLoadingState(submitButton, false);
        } catch (error) {
            showFormMessage(e.target, 'An error occurred. Please try again.', 'error');
            setLoadingState(submitButton, false);
        }
    }, 1500);
}

// Validation functions
function validatePersonalInfo(info) {
    const errors = [];
    
    if (!info.firstName.trim()) errors.push('First name is required');
    if (!info.lastName.trim()) errors.push('Last name is required');
    if (!info.gender) errors.push('Gender is required');
    if (!info.dateOfBirth) errors.push('Date of birth is required');
    if (!info.icNumber.trim()) errors.push('IC number is required');
    if (!info.phone.trim()) errors.push('Mobile phone is required');
    if (!info.country.trim()) errors.push('Country is required');
    if (!info.state.trim()) errors.push('State is required');
    if (!info.city.trim()) errors.push('City is required');
    if (!info.postcode.trim()) errors.push('Postcode is required');
    if (!info.address1.trim()) errors.push('Address line 1 is required');
    
    // Validate phone format
    if (info.phone && !/^\+?[\d\s\-()]+$/.test(info.phone)) {
        errors.push('Please enter a valid phone number');
    }
    
    // Validate IC format (basic validation)
    if (info.icNumber && !/^\d{6}-\d{2}-\d{4}$/.test(info.icNumber)) {
        errors.push('Please enter IC number in format: 123456-12-1234');
    }
    
    return errors;
}

function validateBankInfo(info) {
    const errors = [];
    
    if (!info.bankName.trim()) errors.push('Bank name is required');
    if (!info.accountNumber.trim()) errors.push('Bank account number is required');
    if (!info.accountHolder.trim()) errors.push('Account holder name is required');
    if (!info.confirmation) errors.push('Please confirm that all banking information is accurate');
    
    // Validate account number (basic validation)
    if (info.accountNumber && !/^\d{8,20}$/.test(info.accountNumber.replace(/\s/g, ''))) {
        errors.push('Please enter a valid account number (8-20 digits)');
    }
    
    return errors;
}

// Setup form validation
function setupFormValidation() {
    // Real-time validation for IC number
    const icInput = document.querySelector('input[placeholder*="010203-10-1234"]');
    if (icInput) {
        icInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.substring(0, 6) + '-' + value.substring(6);
            }
            if (value.length >= 9) {
                value = value.substring(0, 9) + '-' + value.substring(9, 13);
            }
            e.target.value = value;
        });
    }
    
    // Real-time validation for phone number
    const phoneInput = document.querySelector('input[type="tel"]');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function(e) {
            const value = e.target.value.trim();
            if (value && !/^\+?[\d\s\-()]+$/.test(value)) {
                e.target.style.borderColor = '#e74c3c';
            } else {
                e.target.style.borderColor = '#e1e5e9';
            }
        });
    }
}

// Utility functions
function showFormMessage(form, message, type) {
    // Remove existing messages
    const existingMessage = form.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the form
    form.insertBefore(messageDiv, form.firstChild);
    
    // Auto-remove success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        button.originalText = button.textContent;
        button.textContent = 'Saving...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = button.originalText || button.textContent.replace('Saving...', 'Save');
    }
}

// Auto-save functionality (optional)
function setupAutoSave() {
    const inputs = document.querySelectorAll('input, select');
    let saveTimeout;
    
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                // Auto-save logic here
                console.log('Auto-saving...', this.name, this.value);
            }, 2000);
        });
    });
}