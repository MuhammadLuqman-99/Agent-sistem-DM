// Logout Page Functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeLogoutPage();
});

// Initialize logout page
function initializeLogoutPage() {
    // Detect user role from URL parameters or referrer
    detectUserRole();
    
    // Set user information
    setUserInformation();
    
    // Add keyboard shortcuts
    addKeyboardShortcuts();
    
    // Auto-detect session information
    detectSessionInfo();
}

// Detect user role and set appropriate information
function detectUserRole() {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role') || detectRoleFromReferrer() || 'agent';
    
    const userRoleElement = document.getElementById('userRole');
    if (userRoleElement) {
        userRoleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }
    
    // Store role for logout redirect
    sessionStorage.setItem('userRole', role);
}

// Detect role from referrer URL
function detectRoleFromReferrer() {
    const referrer = document.referrer;
    if (referrer.includes('admin')) {
        return 'admin';
    } else if (referrer.includes('agent')) {
        return 'agent';
    }
    return null;
}

// Set user information
function setUserInformation() {
    const userNameElement = document.getElementById('userName');
    const role = sessionStorage.getItem('userRole') || 'agent';
    
    // Get user name from session storage or set default
    const userName = sessionStorage.getItem('userName') || 
                    (role === 'admin' ? 'Admin User' : 'Agent User');
    
    if (userNameElement) {
        userNameElement.textContent = userName;
    }
}

// Add keyboard shortcuts
function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmLogout();
        } else if (e.key === 'Escape') {
            cancelLogout();
        }
    });
}

// Detect session information
function detectSessionInfo() {
    // Check if there's an active session
    const hasActiveSession = sessionStorage.getItem('isLoggedIn') === 'true' || 
                            localStorage.getItem('isLoggedIn') === 'true';
    
    if (!hasActiveSession) {
        // If no active session, redirect to login immediately
        redirectToLogin();
    }
}

// Cancel logout and go back
function cancelLogout() {
    showNotification('Logout cancelled', 'info');
    
    // Animate card
    const card = document.querySelector('.logout-card');
    card.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        goBack();
    }, 200);
}

// Confirm logout
function confirmLogout() {
    // Show loading overlay
    showLoadingOverlay();
    
    // Simulate logout process
    performLogout();
}

// Show loading overlay
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

// Hide loading overlay
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Perform logout process
function performLogout() {
    // Add success animation to card
    const card = document.querySelector('.logout-card');
    card.classList.add('success');
    
    // Simulate server logout process
    setTimeout(() => {
        // Clear session data
        clearSessionData();
        
        // Show success notification
        showNotification('Logged out successfully', 'success');
        
        // Redirect after delay
        setTimeout(() => {
            redirectToLogin();
        }, 1500);
        
    }, 2000);
}

// Clear all session data
function clearSessionData() {
    // Clear session storage
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('authToken');
    
    // Clear local storage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authToken');
    localStorage.removeItem('rememberMe');
    
    // Clear any other stored data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('user_') || key.startsWith('session_'))) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
}

// Go back to previous page
function goBack() {
    const role = sessionStorage.getItem('userRole') || 'agent';
    
    // Determine where to go back to
    if (document.referrer && document.referrer !== window.location.href) {
        window.location.href = document.referrer;
    } else {
        // Default fallback based on role
        if (role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'agent-dashboard.html';
        }
    }
}

// Redirect to login page
function redirectToLogin() {
    const role = sessionStorage.getItem('userRole') || 'agent';
    
    // Hide loading overlay
    hideLoadingOverlay();
    
    // Redirect to login page with success parameter
    window.location.href = 'login.html?logout=success';
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
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
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Prevent going back using browser back button during logout
window.addEventListener('beforeunload', (e) => {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay && overlay.classList.contains('show')) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden
        return;
    }
    
    // Page is visible again, check if still logged in
    const overlay = document.getElementById('loadingOverlay');
    if (overlay && overlay.classList.contains('show')) {
        // If logout is in progress, don't interrupt
        return;
    }
    
    // Refresh user information
    setUserInformation();
});

// Auto-logout after extended inactivity (optional)
let inactivityTimer;
const INACTIVITY_TIMEOUT = 300000; // 5 minutes

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        showNotification('Session expired due to inactivity', 'warning');
        setTimeout(confirmLogout, 2000);
    }, INACTIVITY_TIMEOUT);
}

// Track user activity
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
});

// Initialize inactivity timer
resetInactivityTimer();