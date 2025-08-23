// Firebase Logout Functionality
import { auth } from '../config/firebase-config.js';
import { signOut, onAuthStateChanged } from 'firebase/auth';

class FirebaseLogout {
    constructor() {
        this.isLoggingOut = false;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeLogoutPage();
        });

        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            if (!user && !this.isLoggingOut) {
                // User is not logged in and this isn't part of logout process
                this.redirectToLogin();
            }
        });
    }

    // Initialize logout page
    initializeLogoutPage() {
        this.detectUserRole();
        this.setUserInformation();
        this.addKeyboardShortcuts();
        this.detectSessionInfo();
    }

    // Detect user role and set appropriate information
    detectUserRole() {
        const urlParams = new URLSearchParams(window.location.search);
        const role = urlParams.get('role') || 
                    localStorage.getItem('userRole') || 
                    this.detectRoleFromReferrer() || 
                    'agent';
        
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        }
        
        sessionStorage.setItem('userRole', role);
    }

    // Detect role from referrer URL
    detectRoleFromReferrer() {
        const referrer = document.referrer;
        if (referrer.includes('admin')) {
            return 'admin';
        } else if (referrer.includes('agent')) {
            return 'agent';
        }
        return null;
    }

    // Set user information from Firebase or localStorage
    setUserInformation() {
        const userNameElement = document.getElementById('userName');
        const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || 'agent';
        
        // Get user name from localStorage (set during login) or Firebase auth
        let userName = localStorage.getItem('userName');
        
        if (!userName && auth.currentUser) {
            userName = auth.currentUser.displayName || auth.currentUser.email;
        }
        
        if (!userName) {
            userName = role === 'admin' ? 'Admin User' : 'Agent User';
        }
        
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }

    // Add keyboard shortcuts
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirmLogout();
            } else if (e.key === 'Escape') {
                this.cancelLogout();
            }
        });
    }

    // Detect session information
    detectSessionInfo() {
        // Check if Firebase user is logged in
        if (!auth.currentUser) {
            console.log('No Firebase user found, redirecting to login');
            this.redirectToLogin();
        }
    }

    // Cancel logout and go back
    cancelLogout() {
        this.showNotification('Logout cancelled', 'info');
        
        const card = document.querySelector('.logout-card');
        if (card) {
            card.style.transform = 'scale(0.95)';
        }
        
        setTimeout(() => {
            this.goBack();
        }, 200);
    }

    // Confirm logout
    async confirmLogout() {
        if (this.isLoggingOut) return;
        
        this.isLoggingOut = true;
        this.showLoadingOverlay();
        
        try {
            await this.performFirebaseLogout();
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Logout failed. Please try again.', 'error');
            this.isLoggingOut = false;
            this.hideLoadingOverlay();
        }
    }

    // Show loading overlay
    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    // Hide loading overlay
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    // Perform Firebase logout process
    async performFirebaseLogout() {
        const card = document.querySelector('.logout-card');
        if (card) {
            card.classList.add('success');
        }
        
        try {
            // Sign out from Firebase
            await signOut(auth);
            
            // Clear all local storage and session storage
            this.clearAllSessionData();
            
            // Show success notification
            this.showNotification('Logged out successfully', 'success');
            
            // Redirect after delay
            setTimeout(() => {
                this.isLoggingOut = false;
                this.redirectToLogin();
            }, 1500);
            
        } catch (error) {
            console.error('Firebase signOut error:', error);
            throw error;
        }
    }

    // Clear all session data including Firebase related data
    clearAllSessionData() {
        // Clear session storage
        sessionStorage.clear();
        
        // Clear localStorage selectively (keep some Firebase config if needed)
        const keysToKeep = [
            'firebaseMigrationCompleted' // Keep migration status
        ];
        
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !keysToKeep.includes(key)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('Session data cleared');
    }

    // Go back to previous page
    goBack() {
        const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || 'agent';
        
        if (document.referrer && document.referrer !== window.location.href) {
            window.location.href = document.referrer;
        } else {
            if (role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'agent-dashboard.html';
            }
        }
    }

    // Redirect to login page
    redirectToLogin() {
        this.hideLoadingOverlay();
        
        // Redirect to Firebase login page with success parameter
        const hasLoggedOut = this.isLoggingOut || !auth.currentUser;
        if (hasLoggedOut) {
            window.location.href = 'firebase-login.html?logout=success';
        } else {
            window.location.href = 'firebase-login.html';
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
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
        
        // Add styles for notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
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
}

// Initialize Firebase logout when page loads
const firebaseLogout = new FirebaseLogout();

// Export for global access
window.cancelLogout = () => firebaseLogout.cancelLogout();
window.confirmLogout = () => firebaseLogout.confirmLogout();