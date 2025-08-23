// Agent Dashboard Functionality with Enhanced Features
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    initializeFormHandlers();
    initializeButtonHandlers();
    initializeMenuHighlighting();
    initializeProfileDropdown();
});

// Initialize dashboard functionality
function initializeDashboard() {
    // Sales Form Handling
    const salesForm = document.getElementById('salesForm');
    if (salesForm) {
        salesForm.addEventListener('submit', handleSalesFormSubmission);
    }

    // Profile Forms
    const profileForms = document.querySelectorAll('form');
    profileForms.forEach(form => {
        if (form.id !== 'salesForm') {
            form.addEventListener('submit', handleFormSubmission);
        }
    });
}

// Initialize form handlers
function initializeFormHandlers() {
    // Profile form handling
    const profileForm = document.querySelector('form');
    if (profileForm && window.location.pathname.includes('profile.html')) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Change password form handling
    if (window.location.pathname.includes('change-password.html')) {
        const passwordForm = document.querySelector('form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', handlePasswordChange);
        }
    }
}

// Initialize button handlers
function initializeButtonHandlers() {
    // Export buttons
    const exportButtons = document.querySelectorAll('[onclick="exportSalesData()"], .btn-export');
    exportButtons.forEach(btn => {
        // Skip search clear button
        if (btn.id === 'clearSearchBtn') return;
        
        btn.removeAttribute('onclick');
        btn.addEventListener('click', handleExportData);
    });

    // Action buttons (View, Download, etc.)
    const actionButtons = document.querySelectorAll('.action-btn, .btn-view, .btn-download');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', handleActionButton);
    });

    // New Return button
    const newReturnBtn = document.getElementById('newReturnBtn');
    if (newReturnBtn) {
        newReturnBtn.addEventListener('click', handleNewReturn);
    }

    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch(e);
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', handleClearSearch);
    }

    // Delete/Remove buttons
    const deleteButtons = document.querySelectorAll('.btn-danger, .btn-delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', handleDeleteAction);
    });
}

// Initialize menu highlighting
function initializeMenuHighlighting() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
            const href = link.getAttribute('href');
            if (href && (href.includes(currentPage) || 
                (currentPage === 'agent-dashboard.html' && href.includes('agent-dashboard.html')))) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    });
}

// Sales form submission handler
function handleSalesFormSubmission(e) {
    e.preventDefault();
    
    const formData = {
        customer: document.getElementById('customerName').value,
        product: document.getElementById('product').value,
        amount: document.getElementById('amount').value,
        status: document.getElementById('status').value
    };

    // Validate form data
    const errors = validateSaleForm(formData);
    if (errors.length > 0) {
        showNotification(errors.join(', '), 'error');
        return;
    }

    // Show confirmation dialog
    showConfirmDialog(
        'Confirm Sale Entry',
        `Are you sure you want to add this sale for ${formData.customer}?`,
        () => {
            // Process the sale
            const newSale = {
                date: new Date().toLocaleDateString(),
                customer: formData.customer,
                product: formData.product,
                amount: formData.amount,
                status: formData.status
            };

            // Add to sales table
            addSaleToTable(newSale);
            
            // Clear form
            document.getElementById('salesForm').reset();
            
            // Show success message
            showNotification('Sale added successfully!', 'success');
        }
    );
}

// Add sale to table
function addSaleToTable(newSale) {
    const salesTable = document.querySelector('tbody');
    if (!salesTable) return;

    const newRow = document.createElement('tr');
    
    const statusClass = newSale.status === 'completed' ? 
        'status-badge success' : 
        'status-badge pending';
    
    newRow.innerHTML = `
        <td>${newSale.date}</td>
        <td>${newSale.customer}</td>
        <td>${newSale.product}</td>
        <td>$${newSale.amount}</td>
        <td>
            <span class="${statusClass}">
                ${newSale.status.charAt(0).toUpperCase() + newSale.status.slice(1)}
            </span>
        </td>
    `;

    salesTable.prepend(newRow);
    
    // Add fade-in animation
    newRow.style.opacity = '0';
    setTimeout(() => {
        newRow.style.transition = 'opacity 0.5s ease-in';
        newRow.style.opacity = '1';
    }, 100);
}

// Profile update handler
function handleProfileUpdate(e) {
    e.preventDefault();
    
    showConfirmDialog(
        'Update Profile',
        'Are you sure you want to update your profile information?',
        () => {
            // Simulate API call
            showLoadingButton(e.target.querySelector('button[type="submit"]'));
            
            // Save form data to localStorage
            saveProfileFormData(e.target);
            
            setTimeout(() => {
                hideLoadingButton(e.target.querySelector('button[type="submit"]'));
                
                // Update dropdown and header info
                updateDropdownFromProfile();
                
                showNotification('Profile updated successfully!', 'success');
            }, 1500);
        }
    );
}

// Save profile form data
function saveProfileFormData(form) {
    const formData = new FormData(form);
    
    // Get form field values
    const firstName = form.querySelector('input[type="text"]:first-of-type').value;
    const lastName = form.querySelector('input[type="text"]:nth-of-type(2)').value;
    const gender = form.querySelector('select').value;
    const dateOfBirth = form.querySelector('input[type="date"]').value;
    const icNumber = form.querySelector('input[placeholder*="010203"]').value;
    const mobilePhone = form.querySelector('input[type="tel"]').value;
    const country = form.querySelector('input[placeholder*="country"]').value;
    const state = form.querySelector('input[placeholder*="state"]').value;
    const city = form.querySelector('input[placeholder*="city"]').value;
    const postcode = form.querySelector('input[placeholder*="postcode"]').value;
    const addressLine1 = form.querySelector('input[placeholder*="address line 1"]').value;
    const addressLine2 = form.querySelector('input[placeholder*="address line 2"]').value;
    
    // Bank information (if present)
    const bankName = form.querySelector('input[placeholder*="bank name"]')?.value;
    const bankAccountNumber = form.querySelector('input[placeholder*="account number"]')?.value;
    const bankAccountHolder = form.querySelector('input[placeholder*="account holder"]')?.value;
    
    // Create profile object
    const profileData = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        gender,
        dateOfBirth,
        icNumber,
        mobilePhone,
        country,
        state,
        city,
        postcode,
        addressLine1,
        addressLine2,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@agentOS.com`
    };
    
    // Add bank info if available
    if (bankName) profileData.bankName = bankName;
    if (bankAccountNumber) profileData.bankAccountNumber = bankAccountNumber;
    if (bankAccountHolder) profileData.bankAccountHolder = bankAccountHolder;
    
    // Save to localStorage
    Object.keys(profileData).forEach(key => {
        if (profileData[key]) {
            localStorage.setItem(key, profileData[key]);
        }
    });
    
    // Update display name
    localStorage.setItem('userName', profileData.fullName);
    
    console.log('Profile data saved:', profileData);
}

// Update dropdown from profile changes
function updateDropdownFromProfile() {
    const userName = localStorage.getItem('userName');
    const email = localStorage.getItem('email');
    
    // Update header profile name
    const profileName = document.getElementById('profileName');
    if (profileName && userName) {
        profileName.textContent = userName;
    }
    
    // Update dropdown profile info
    const dropdownName = document.querySelector('.profile-info h3');
    if (dropdownName && userName) {
        dropdownName.textContent = userName;
    }
    
    // Update email display
    const emailDisplay = document.querySelector('.profile-email');
    if (emailDisplay && email) {
        emailDisplay.textContent = email;
    }
    
    // Update avatar URLs
    updateAvatarImages(userName);
    
    console.log('Dropdown updated with new profile data');
}

// Update avatar images with new name
function updateAvatarImages(fullName) {
    if (!fullName) return;
    
    // Don't update if user has custom photo
    if (localStorage.getItem('userProfilePhoto')) return;
    
    const encodedName = encodeURIComponent(fullName);
    const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=6c757d&color=fff`;
    
    // Update all profile images
    const profileImage = document.getElementById('profileImage');
    const dropdownProfileImage = document.getElementById('dropdownProfileImage');
    
    if (profileImage) profileImage.src = newAvatarUrl;
    if (dropdownProfileImage) dropdownProfileImage.src = newAvatarUrl;
}

// Password change handler
function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = e.target.querySelector('input[type="password"]:nth-of-type(1)').value;
    const newPassword = e.target.querySelector('input[type="password"]:nth-of-type(2)').value;
    const confirmPassword = e.target.querySelector('input[type="password"]:nth-of-type(3)').value;

    // Validate passwords
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match!', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long!', 'error');
        return;
    }

    showConfirmDialog(
        'Change Password',
        'Are you sure you want to change your password?',
        () => {
            // Simulate API call
            showLoadingButton(e.target.querySelector('button[type="submit"]'));
            
            setTimeout(() => {
                hideLoadingButton(e.target.querySelector('button[type="submit"]'));
                e.target.reset();
                showNotification('Password changed successfully!', 'success');
            }, 1500);
        }
    );
}

// Generic form submission handler
function handleFormSubmission(e) {
    e.preventDefault();
    
    const formType = e.target.closest('.card').querySelector('.card-header h2').textContent;
    
    showConfirmDialog(
        'Confirm Changes',
        `Are you sure you want to save changes to ${formType}?`,
        () => {
            showLoadingButton(e.target.querySelector('button[type="submit"]'));
            
            // If this is bank information, save it too
            if (formType.includes('Bank Information')) {
                saveProfileFormData(e.target);
                updateDropdownFromProfile();
            }
            
            setTimeout(() => {
                hideLoadingButton(e.target.querySelector('button[type="submit"]'));
                showNotification(`${formType} updated successfully!`, 'success');
            }, 1500);
        }
    );
}

// Export data handler
function handleExportData(e) {
    e.preventDefault();
    
    showConfirmDialog(
        'Export Data',
        'Do you want to export the current data to CSV?',
        () => {
            // Determine what type of data to export based on current page
            if (window.location.pathname.includes('sale-form-list.html')) {
                exportInvoiceData();
            } else if (window.location.pathname.includes('returns.html')) {
                exportReturnsData();
            } else {
                exportSalesData();
            }
            
            showNotification('Data exported successfully!', 'success');
        }
    );
}

// Export sales data to CSV
function exportSalesData() {
    const rows = document.querySelectorAll('tbody tr');
    const csvData = ['Date,Customer,Product,Amount,Status'];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
            const rowData = Array.from(cells).slice(0, 5).map(cell => {
                return cell.textContent.trim().replace(/,/g, ';');
            });
            csvData.push(rowData.join(','));
        }
    });
    
    downloadCSV(csvData.join('\n'), 'sales-data.csv');
}

// Export invoice data to CSV
function exportInvoiceData() {
    const rows = document.querySelectorAll('tbody tr');
    const csvData = ['Invoice,Hash Code,Order Date,Payment Status,Payment Method,Payment Date,Shipping Method,Finance Review'];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 8) {
            const rowData = Array.from(cells).slice(0, 8).map(cell => {
                return cell.textContent.trim().replace(/,/g, ';');
            });
            csvData.push(rowData.join(','));
        }
    });
    
    downloadCSV(csvData.join('\n'), 'invoice-data.csv');
}

// Export returns data to CSV
function exportReturnsData() {
    const rows = document.querySelectorAll('tbody tr');
    const csvData = ['Return Number,Invoice,Date,Return Status,Payment Status,Total,Payment Method,Shipping Type,Reason'];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 9) {
            const rowData = Array.from(cells).slice(0, 9).map(cell => {
                return cell.textContent.trim().replace(/,/g, ';');
            });
            csvData.push(rowData.join(','));
        }
    });
    
    downloadCSV(csvData.join('\n'), 'returns-data.csv');
}

// Download CSV file
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Action button handler (View, Download, etc.)
function handleActionButton(e) {
    e.preventDefault();
    
    const buttonText = e.target.textContent.trim();
    const row = e.target.closest('tr');
    const firstCell = row ? row.querySelector('td')?.textContent.trim() : 'item';
    
    if (buttonText.includes('View')) {
        showNotification(`Viewing details for ${firstCell}`, 'info');
        // Here you would typically open a modal or navigate to detail page
    } else if (buttonText.includes('Download')) {
        showNotification(`Downloading ${firstCell}`, 'info');
        // Here you would typically trigger a file download
    } else if (buttonText.includes('Edit')) {
        showConfirmDialog(
            'Edit Item',
            `Do you want to edit ${firstCell}?`,
            () => {
                showNotification(`Opening editor for ${firstCell}`, 'info');
                // Here you would typically open edit form
            }
        );
    }
}

// New return handler
function handleNewReturn(e) {
    e.preventDefault();
    
    showConfirmDialog(
        'Create New Return',
        'Do you want to create a new return request?',
        () => {
            showNotification('Opening new return form...', 'info');
            // Here you would typically open a return form modal or navigate to return form page
        }
    );
}

// Delete action handler
function handleDeleteAction(e) {
    e.preventDefault();
    
    const row = e.target.closest('tr');
    const itemName = row ? row.querySelector('td')?.textContent.trim() : 'this item';
    
    showConfirmDialog(
        'Delete Confirmation',
        `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
        () => {
            if (row) {
                row.style.transition = 'opacity 0.5s ease-out';
                row.style.opacity = '0';
                setTimeout(() => {
                    row.remove();
                    showNotification(`${itemName} deleted successfully`, 'success');
                }, 500);
            }
        },
        'danger'
    );
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        font-weight: 500;
        font-size: 14px;
        max-width: 350px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    // Set colors based on type
    const colors = {
        success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
        error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
        info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' },
        warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' }
    };
    
    const colorScheme = colors[type] || colors.info;
    notification.style.backgroundColor = colorScheme.bg;
    notification.style.color = colorScheme.color;
    notification.style.border = `1px solid ${colorScheme.border}`;
    
    // Add icon based on type
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ',
        warning: '⚠'
    };
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: bold; font-size: 16px;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Confirmation dialog system
function showConfirmDialog(title, message, onConfirm, type = 'primary') {
    // Remove existing dialogs
    const existingDialogs = document.querySelectorAll('.confirm-dialog');
    existingDialogs.forEach(dialog => dialog.remove());

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        transform: scale(0.9);
        transition: transform 0.3s ease;
    `;

    const buttonColors = {
        primary: { bg: '#212529', hover: '#1a1e21' },
        danger: { bg: '#dc3545', hover: '#c82333' }
    };

    const colorScheme = buttonColors[type] || buttonColors.primary;

    dialog.innerHTML = `
        <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 12px 0; color: #212529; font-size: 18px; font-weight: 600;">${title}</h3>
            <p style="margin: 0; color: #6c757d; line-height: 1.5;">${message}</p>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="cancel-btn" style="
                padding: 8px 16px;
                border: 1px solid #dee2e6;
                background: #f8f9fa;
                color: #495057;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            ">Cancel</button>
            <button class="confirm-btn" style="
                padding: 8px 16px;
                border: none;
                background: ${colorScheme.bg};
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            ">Confirm</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Add hover effects
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const confirmBtn = dialog.querySelector('.confirm-btn');

    cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.background = '#e9ecef';
        cancelBtn.style.borderColor = '#adb5bd';
    });

    cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.background = '#f8f9fa';
        cancelBtn.style.borderColor = '#dee2e6';
    });

    confirmBtn.addEventListener('mouseenter', () => {
        confirmBtn.style.background = colorScheme.hover;
    });

    confirmBtn.addEventListener('mouseleave', () => {
        confirmBtn.style.background = colorScheme.bg;
    });

    // Add event listeners
    cancelBtn.addEventListener('click', closeDialog);
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        closeDialog();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDialog();
        }
    });

    function closeDialog() {
        overlay.style.opacity = '0';
        dialog.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 300);
    }

    // Animate in
    setTimeout(() => {
        overlay.style.opacity = '1';
        dialog.style.transform = 'scale(1)';
    }, 50);
}

// Loading button states
function showLoadingButton(button) {
    if (!button) return;
    
    button.disabled = true;
    button.originalText = button.innerHTML;
    button.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s linear infinite;
            "></div>
            <span>Processing...</span>
        </div>
    `;

    // Add spin animation
    if (!document.querySelector('#spin-animation')) {
        const style = document.createElement('style');
        style.id = 'spin-animation';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideLoadingButton(button) {
    if (!button || !button.originalText) return;
    
    button.disabled = false;
    button.innerHTML = button.originalText;
    delete button.originalText;
}

// Form validation
function validateSaleForm(formData) {
    const errors = [];
    
    if (!formData.customer.trim()) {
        errors.push('Customer name is required');
    }
    
    if (!formData.product.trim()) {
        errors.push('Product is required');
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
        errors.push('Valid amount is required');
    }
    
    if (!formData.status) {
        errors.push('Status is required');
    }
    
    return errors;
}

// Search functionality
function handleSearch(e) {
    e.preventDefault();
    
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        showNotification('Please enter a search term', 'warning');
        return;
    }
    
    const tableRows = document.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    tableRows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    showNotification(`Found ${visibleCount} results for "${searchTerm}"`, 'info');
}

// Clear search functionality
function handleClearSearch(e) {
    e.preventDefault();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach(row => {
        row.style.display = '';
    });
    
    showNotification('Search cleared', 'info');
}

// Profile Dropdown Functionality
function initializeProfileDropdown() {
    const profileToggle = document.getElementById('profileDropdownToggle');
    const profileDropdown = document.getElementById('profileDropdown');
    const photoUploadOverlay = document.getElementById('photoUploadOverlay');
    const photoUploadInput = document.getElementById('photoUploadInput');
    
    if (profileToggle && profileDropdown) {
        // Toggle dropdown on click
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleProfileDropdown();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !profileToggle.contains(e.target)) {
                closeProfileDropdown();
            }
        });
        
        // Prevent dropdown from closing when clicking inside
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Photo upload functionality
    if (photoUploadOverlay && photoUploadInput) {
        photoUploadOverlay.addEventListener('click', () => {
            photoUploadInput.click();
        });
        
        photoUploadInput.addEventListener('change', handlePhotoUpload);
    }
    
    // Load saved profile data
    loadProfileData();
}

// Toggle profile dropdown
function toggleProfileDropdown() {
    const profileToggle = document.getElementById('profileDropdownToggle');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileDropdown.classList.contains('show')) {
        closeProfileDropdown();
    } else {
        openProfileDropdown();
    }
}

// Open profile dropdown
function openProfileDropdown() {
    const profileToggle = document.getElementById('profileDropdownToggle');
    const profileDropdown = document.getElementById('profileDropdown');
    
    profileToggle.classList.add('active');
    profileDropdown.classList.add('show');
}

// Close profile dropdown
function closeProfileDropdown() {
    const profileToggle = document.getElementById('profileDropdownToggle');
    const profileDropdown = document.getElementById('profileDropdown');
    
    profileToggle.classList.remove('active');
    profileDropdown.classList.remove('show');
}

// Handle photo upload
function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size must be less than 5MB', 'error');
        return;
    }
    
    // Show confirmation dialog
    showConfirmDialog(
        'Update Profile Photo',
        'Are you sure you want to change your profile photo?',
        () => {
            uploadProfilePhoto(file);
        }
    );
}

// Upload profile photo
function uploadProfilePhoto(file) {
    const profileImage = document.getElementById('profileImage');
    const dropdownProfileImage = document.getElementById('dropdownProfileImage');
    const photoContainer = document.querySelector('.profile-photo-container');
    
    // Show loading state
    photoContainer.classList.add('photo-uploading');
    
    // Create FileReader to read the file
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Simulate upload delay
        setTimeout(() => {
            try {
                const imageUrl = e.target.result;
                
                // Update profile images
                if (profileImage) profileImage.src = imageUrl;
                if (dropdownProfileImage) dropdownProfileImage.src = imageUrl;
                
                // Save to localStorage
                localStorage.setItem('userProfilePhoto', imageUrl);
                
                // Remove loading state
                photoContainer.classList.remove('photo-uploading');
                
                // Show success notification
                showNotification('Profile photo updated successfully!', 'success');
                
            } catch (error) {
                photoContainer.classList.remove('photo-uploading');
                showNotification('Failed to update profile photo', 'error');
            }
        }, 1500);
    };
    
    reader.onerror = function() {
        photoContainer.classList.remove('photo-uploading');
        showNotification('Failed to read image file', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Initialize demo profile data (call this on first load)
function initializeDemoData() {
    // Check if this is first time loading
    if (!localStorage.getItem('profileInitialized')) {
        // Set demo profile data
        const demoProfile = {
            firstName: 'Ahmad',
            lastName: 'Rahman',
            fullName: 'Ahmad Rahman',
            gender: 'male',
            dateOfBirth: '1990-05-15',
            icNumber: '900515-08-1234',
            mobilePhone: '+60123456789',
            country: 'Malaysia',
            state: 'Selangor',
            city: 'Petaling Jaya',
            postcode: '47400',
            addressLine1: '123, Jalan SS2/24',
            addressLine2: 'SS2',
            bankName: 'Maybank',
            bankAccountNumber: '1234567890123456',
            bankAccountHolder: 'Ahmad Rahman',
            email: 'ahmad.rahman@agentOS.com',
            role: 'agent'
        };
        
        // Save to localStorage
        Object.keys(demoProfile).forEach(key => {
            localStorage.setItem(key, demoProfile[key]);
        });
        
        // Set user name for display
        localStorage.setItem('userName', demoProfile.fullName);
        localStorage.setItem('userRole', demoProfile.role);
        
        // Mark as initialized
        localStorage.setItem('profileInitialized', 'true');
        
        console.log('Demo profile data initialized');
    }
}

// Load profile data
function loadProfileData() {
    // Initialize demo data if needed
    initializeDemoData();
    
    // Load saved profile photo
    const savedPhoto = localStorage.getItem('userProfilePhoto');
    if (savedPhoto) {
        const profileImage = document.getElementById('profileImage');
        const dropdownProfileImage = document.getElementById('dropdownProfileImage');
        
        if (profileImage) profileImage.src = savedPhoto;
        if (dropdownProfileImage) dropdownProfileImage.src = savedPhoto;
    }
    
    // Load user name and role
    const userName = localStorage.getItem('userName') || 'Agent User';
    const userRole = localStorage.getItem('userRole') || 'agent';
    
    // Update profile name
    const profileName = document.getElementById('profileName');
    if (profileName) {
        profileName.textContent = userName;
    }
    
    // Update dropdown profile info
    const dropdownProfileInfo = document.querySelector('.profile-info h3');
    if (dropdownProfileInfo) {
        dropdownProfileInfo.textContent = userName;
    }
    
    // Update role display
    const roleDisplay = document.querySelector('.profile-info p');
    if (roleDisplay) {
        roleDisplay.textContent = userRole === 'admin' ? 'System Administrator' : 'Sales Agent';
    }
    
    // Update email display
    const emailDisplay = document.querySelector('.profile-email');
    if (emailDisplay) {
        const email = localStorage.getItem('email') || 'agent@agentOS.com';
        emailDisplay.textContent = email;
    }
    
    // Load profile form data if on profile page
    loadProfileFormData();
}

// Load profile form data
function loadProfileFormData() {
    // Only run on profile page
    if (!window.location.pathname.includes('profile.html')) return;
    
    // Profile form fields mapping
    const fieldMappings = {
        'firstName': 'input[type="text"]:first-of-type',
        'lastName': 'input[type="text"]:nth-of-type(2)',
        'gender': 'select',
        'dateOfBirth': 'input[type="date"]',
        'icNumber': 'input[placeholder*="010203"]',
        'mobilePhone': 'input[type="tel"]',
        'country': 'input[placeholder*="country"]',
        'state': 'input[placeholder*="state"]', 
        'city': 'input[placeholder*="city"]',
        'postcode': 'input[placeholder*="postcode"]',
        'addressLine1': 'input[placeholder*="address line 1"]',
        'addressLine2': 'input[placeholder*="address line 2"]',
        'bankName': 'input[placeholder*="bank name"]',
        'bankAccountNumber': 'input[placeholder*="account number"]',
        'bankAccountHolder': 'input[placeholder*="account holder"]'
    };
    
    // Populate form fields with saved data
    Object.keys(fieldMappings).forEach(key => {
        const value = localStorage.getItem(key);
        const selector = fieldMappings[key];
        const element = document.querySelector(selector);
        
        if (element && value) {
            if (element.tagName === 'SELECT') {
                // For select elements
                element.value = value;
            } else {
                // For input elements
                element.value = value;
            }
        }
    });
    
    console.log('Profile form data loaded');
}

// Toggle notifications
function toggleNotifications() {
    showNotification('Notifications panel opened', 'info');
    // Here you would typically open a notifications panel
}

// Update profile stats (for real-time updates)
function updateProfileStats(stats) {
    const statItems = document.querySelectorAll('.stat-item');
    
    statItems.forEach((item, index) => {
        const statNumber = item.querySelector('.stat-number');
        if (statNumber && stats[index]) {
            // Animate number change
            animateNumber(statNumber, stats[index]);
        }
    });
}

// Animate number changes
function animateNumber(element, newValue) {
    const currentValue = element.textContent;
    const isNumeric = !isNaN(parseFloat(currentValue));
    
    if (isNumeric) {
        const start = parseFloat(currentValue);
        const end = parseFloat(newValue);
        const duration = 1000;
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * progress;
            element.textContent = Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    } else {
        element.textContent = newValue;
    }
}

// Export profile data
function exportProfileData() {
    const profileData = {
        name: localStorage.getItem('userName') || 'Agent User',
        role: localStorage.getItem('userRole') || 'agent',
        photo: localStorage.getItem('userProfilePhoto'),
        exportDate: new Date().toISOString(),
        stats: {
            sales: document.querySelector('.stat-number')?.textContent || '0',
            revenue: document.querySelectorAll('.stat-number')[1]?.textContent || '$0',
            successRate: document.querySelectorAll('.stat-number')[2]?.textContent || '0%'
        }
    };
    
    const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Profile data exported successfully!', 'success');
}

// Update profile information
function updateProfileInfo(newInfo) {
    if (newInfo.name) {
        localStorage.setItem('userName', newInfo.name);
        const profileName = document.getElementById('profileName');
        const dropdownName = document.querySelector('.profile-info h3');
        
        if (profileName) profileName.textContent = newInfo.name;
        if (dropdownName) dropdownName.textContent = newInfo.name;
    }
    
    if (newInfo.role) {
        localStorage.setItem('userRole', newInfo.role);
        const roleDisplay = document.querySelector('.profile-info p');
        if (roleDisplay) {
            roleDisplay.textContent = newInfo.role === 'admin' ? 'System Administrator' : 'Sales Agent';
        }
    }
    
    showNotification('Profile information updated', 'success');
}

// Utility function to check if element contains text
HTMLElement.prototype.contains = function(text) {
    return this.textContent.includes(text);
};