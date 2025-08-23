// Test user database
const testUsers = [
    { 
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        name: 'Admin User',
        team: 'Management'
    },
    {
        email: 'team.leader@example.com',
        password: 'team123',
        role: 'team',
        name: 'Sarah Wilson',
        team: 'Sales Team A'
    },
    {
        email: 'agent.john@example.com',
        password: 'agent123',
        role: 'agent',
        name: 'John Doe',
        team: 'Sales Team B'
    }
];

// Auto-fill credentials for testing
function fillCredentials(email, password) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
}

// Show notification message
function showNotification(message, type = 'error') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        ${type === 'error' ? 'background-color: #e74c3c;' : ''}
        ${type === 'success' ? 'background-color: #27ae60;' : ''}
        ${type === 'info' ? 'background-color: #3498db;' : ''}
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Form validation
function validateLoginForm(email, password) {
    const errors = [];
    
    if (!email.trim()) {
        errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!password.trim()) {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    
    return errors;
}

// Authentication logic
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Validate form inputs
            const errors = validateLoginForm(email, password);
            if (errors.length > 0) {
                showNotification(errors.join('. '), 'error');
                return;
            }
            
            // Add loading state
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Signing in...';
            submitButton.disabled = true;
            
            // Simulate API call delay
            setTimeout(() => {
                const user = testUsers.find(u => u.email === email && u.password === password);
                
                if (user) {
                    // Store user data in session
                    sessionStorage.setItem('currentUser', JSON.stringify(user));
                    showNotification(`Welcome back, ${user.name}!`, 'success');
                    
                    // Redirect based on role
                    setTimeout(() => {
                        if (user.role === 'admin') {
                            window.location.href = 'pages/admin-dashboard.html'; // Admin dashboard
                        } else {
                            window.location.href = 'pages/agent-dashboard.html'; // Agent dashboard
                        }
                    }, 1000);
                } else {
                    showNotification('Invalid email or password. Please try again or use the test accounts below.', 'error');
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }
            }, 1000);
        });
    }
    
    // Add Enter key support for test account buttons
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'BUTTON' && e.target.onclick) {
            e.target.click();
        }
    });
    
    // Check if user is already logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser && window.location.pathname.includes('login.html')) {
        const user = JSON.parse(currentUser);
        showNotification(`You're already logged in as ${user.name}`, 'info');
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = 'pages/admin-dashboard.html';
            } else {
                window.location.href = 'pages/agent-dashboard.html';
            }
        }, 2000);
    }
});

// Make fillCredentials available globally
window.fillCredentials = fillCredentials;