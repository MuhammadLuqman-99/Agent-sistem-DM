// Firebase Agent Dashboard Integration
import firebaseService from '../../services/firebase-service.js';
import migrationService from '../../services/migration-service.js';

class FirebaseAgentDashboard {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.salesData = [];
        this.returnsData = [];
        this.stats = {};
        
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeDashboard());
        } else {
            await this.initializeDashboard();
        }
    }

    async initializeDashboard() {
        try {
            // Check authentication
            if (!firebaseService.isAuthenticated()) {
                window.location.href = 'firebase-login.html';
                return;
            }

            // Check if user is agent
            if (!firebaseService.isAgent()) {
                window.location.href = 'firebase-login.html';
                return;
            }

            this.currentUser = firebaseService.getCurrentUser();
            
            // Load user profile
            await this.loadUserProfile();
            
            // Check if migration is needed
            if (migrationService.isMigrationNeeded()) {
                await this.performDataMigration();
            }
            
            // Initialize dashboard components
            await this.loadDashboardData();
            this.initializeUI();
            this.setupEventListeners();
            
            console.log('Firebase Agent Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showNotification('Failed to load dashboard. Please refresh the page.', 'error');
        }
    }

    // Load user profile from Firebase
    async loadUserProfile() {
        try {
            this.userProfile = await firebaseService.getUserProfile(this.currentUser.uid);
            
            if (this.userProfile) {
                this.updateUIWithProfile();
            } else {
                console.warn('User profile not found');
            }
            
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    // Update UI with user profile data
    updateUIWithProfile() {
        if (!this.userProfile) return;

        // Update profile name in header
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = this.userProfile.fullName || this.userProfile.firstName + ' ' + this.userProfile.lastName;
        }

        // Update dropdown profile info
        const dropdownName = document.querySelector('.profile-info h3');
        if (dropdownName) {
            dropdownName.textContent = this.userProfile.fullName || this.userProfile.firstName + ' ' + this.userProfile.lastName;
        }

        // Update email display
        const emailDisplay = document.querySelector('.profile-email');
        if (emailDisplay) {
            emailDisplay.textContent = this.userProfile.email || this.currentUser.email;
        }

        // Update profile form fields if on profile page
        this.populateProfileForm();

        // Update avatar images
        this.updateAvatarImages();
    }

    // Populate profile form with Firebase data
    populateProfileForm() {
        if (!window.location.pathname.includes('profile.html') || !this.userProfile) return;

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

        Object.keys(fieldMappings).forEach(key => {
            const value = this.userProfile[key];
            const selector = fieldMappings[key];
            const element = document.querySelector(selector);
            
            if (element && value) {
                element.value = value;
            }
        });
    }

    // Update avatar images
    updateAvatarImages() {
        if (!this.userProfile) return;

        // Use custom profile photo if available, otherwise generate avatar
        let avatarUrl;
        if (this.userProfile.profilePhoto) {
            avatarUrl = this.userProfile.profilePhoto;
        } else {
            const fullName = this.userProfile.fullName || this.userProfile.firstName + ' ' + this.userProfile.lastName;
            const encodedName = encodeURIComponent(fullName);
            avatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=6c757d&color=fff`;
        }

        const profileImage = document.getElementById('profileImage');
        const dropdownProfileImage = document.getElementById('dropdownProfileImage');
        
        if (profileImage) profileImage.src = avatarUrl;
        if (dropdownProfileImage) dropdownProfileImage.src = avatarUrl;
    }

    // Perform data migration if needed
    async performDataMigration() {
        try {
            this.showNotification('Migrating data to Firebase...', 'info');
            const result = await migrationService.migrateAllData();
            
            if (result.success) {
                this.showNotification('Data migration completed successfully!', 'success');
            } else {
                console.error('Migration failed:', result.error);
                this.showNotification('Data migration failed. Some features may not work properly.', 'warning');
            }
        } catch (error) {
            console.error('Migration error:', error);
            this.showNotification('Data migration encountered an error.', 'error');
        }
    }

    // Load dashboard data from Firebase
    async loadDashboardData() {
        try {
            // Load agent sales data
            this.salesData = await firebaseService.getAgentSales(this.currentUser.uid);
            
            // Load agent returns data
            this.returnsData = await firebaseService.getAgentReturns(this.currentUser.uid);
            
            // Get agent statistics
            this.stats = await firebaseService.getAgentStats(this.currentUser.uid);
            
            // Update dashboard UI with data
            this.updateDashboardUI();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    // Update dashboard UI with Firebase data
    updateDashboardUI() {
        // Update stats cards
        this.updateStatsCards();
        
        // Update sales table if on sales page
        if (window.location.pathname.includes('sale-form-list.html')) {
            this.updateSalesTable();
        }
        
        // Update returns table if on returns page
        if (window.location.pathname.includes('returns.html')) {
            this.updateReturnsTable();
        }
        
        // Update profile dropdown stats
        this.updateDropdownStats();
    }

    // Update stats cards on dashboard
    updateStatsCards() {
        const statsElements = {
            totalSales: document.querySelector('[data-stat="total-sales"]'),
            totalRevenue: document.querySelector('[data-stat="total-revenue"]'),
            successRate: document.querySelector('[data-stat="success-rate"]'),
            pendingSales: document.querySelector('[data-stat="pending-sales"]')
        };

        if (statsElements.totalSales) {
            statsElements.totalSales.textContent = this.stats.totalSales || 0;
        }
        
        if (statsElements.totalRevenue) {
            statsElements.totalRevenue.textContent = `RM${(this.stats.totalRevenue || 0).toFixed(2)}`;
        }
        
        if (statsElements.successRate) {
            statsElements.successRate.textContent = `${this.stats.successRate || 0}%`;
        }
        
        if (statsElements.pendingSales) {
            statsElements.pendingSales.textContent = this.stats.pendingSales || 0;
        }
    }

    // Update dropdown profile stats
    updateDropdownStats() {
        const statElements = document.querySelectorAll('.stat-number');
        if (statElements.length >= 3) {
            statElements[0].textContent = this.stats.totalSales || 23;
            statElements[1].textContent = `$${((this.stats.totalRevenue || 12500) / 1000).toFixed(1)}K`;
            statElements[2].textContent = `${this.stats.successRate || 82}%`;
        }
    }

    // Update sales table
    updateSalesTable() {
        const tbody = document.querySelector('table tbody');
        if (!tbody || !this.salesData.length) return;

        tbody.innerHTML = '';
        
        this.salesData.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.invoiceNumber || 'N/A'}</td>
                <td>${sale.hashCode || 'N/A'}</td>
                <td>${this.formatDate(sale.orderDate || sale.createdAt)}</td>
                <td><span class="status-badge ${this.getStatusClass(sale.paymentStatus)}">${this.formatStatus(sale.paymentStatus)}</span></td>
                <td>${sale.paymentMethod || 'N/A'}</td>
                <td>${this.formatDate(sale.paymentDate)}</td>
                <td>${sale.shippingMethod || 'N/A'}</td>
                <td><span class="status-badge ${this.getStatusClass(sale.financeReview)}">${this.formatStatus(sale.financeReview)}</span></td>
                <td>
                    <div class="action-buttons">
                        <a href="#" class="action-btn btn-view" onclick="viewSale('${sale.id}')"><i class="fas fa-eye"></i> View</a>
                        <a href="#" class="action-btn btn-edit" onclick="downloadSale('${sale.id}')"><i class="fas fa-download"></i> Download</a>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Update returns table
    updateReturnsTable() {
        const tbody = document.querySelector('table tbody');
        if (!tbody || !this.returnsData.length) return;

        tbody.innerHTML = '';
        
        this.returnsData.forEach(returnItem => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${returnItem.returnNumber || 'N/A'}</td>
                <td>${returnItem.invoiceNumber || 'N/A'}</td>
                <td>${this.formatDate(returnItem.date || returnItem.createdAt)}</td>
                <td><span class="status-badge ${this.getStatusClass(returnItem.returnStatus)}">${this.formatStatus(returnItem.returnStatus)}</span></td>
                <td>${this.formatStatus(returnItem.paymentStatus)}</td>
                <td>RM${(returnItem.total || 0).toFixed(2)}</td>
                <td>${returnItem.paymentMethod || 'N/A'}</td>
                <td>${returnItem.shippingType || 'N/A'}</td>
                <td>${returnItem.reason || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Initialize UI components
    initializeUI() {
        // Initialize original agent script functionality
        if (typeof initializeDashboard === 'function') {
            initializeDashboard();
        }
        if (typeof initializeFormHandlers === 'function') {
            initializeFormHandlers();
        }
        if (typeof initializeButtonHandlers === 'function') {
            initializeButtonHandlers();
        }
        if (typeof initializeProfileDropdown === 'function') {
            initializeProfileDropdown();
        }
    }

    // Setup event listeners for Firebase integration
    setupEventListeners() {
        // Profile form submission
        const profileForms = document.querySelectorAll('form');
        profileForms.forEach(form => {
            if (window.location.pathname.includes('profile.html')) {
                form.addEventListener('submit', (e) => this.handleProfileUpdate(e));
            }
        });

        // Photo upload
        const photoUploadInput = document.getElementById('photoUploadInput');
        if (photoUploadInput) {
            photoUploadInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }

        // New return button
        const newReturnBtn = document.getElementById('newReturnBtn');
        if (newReturnBtn) {
            newReturnBtn.addEventListener('click', () => this.handleNewReturn());
        }
    }

    // Handle profile update with Firebase
    async handleProfileUpdate(e) {
        e.preventDefault();
        
        this.showConfirmDialog(
            'Update Profile',
            'Are you sure you want to update your profile information?',
            async () => {
                const submitBtn = e.target.querySelector('button[type="submit"]');
                this.showLoadingButton(submitBtn);
                
                try {
                    const formData = this.extractFormData(e.target);
                    const result = await firebaseService.updateUserProfile(this.currentUser.uid, formData);
                    
                    if (result.success) {
                        // Update local profile data
                        this.userProfile = { ...this.userProfile, ...formData };
                        
                        // Update UI
                        this.updateUIWithProfile();
                        
                        this.showNotification('Profile updated successfully!', 'success');
                    } else {
                        throw new Error(result.error || 'Update failed');
                    }
                } catch (error) {
                    console.error('Profile update error:', error);
                    this.showNotification('Failed to update profile. Please try again.', 'error');
                } finally {
                    this.hideLoadingButton(submitBtn);
                }
            }
        );
    }

    // Extract form data
    extractFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        // Get form field values
        const firstName = form.querySelector('input[type="text"]:first-of-type')?.value;
        const lastName = form.querySelector('input[type="text"]:nth-of-type(2)')?.value;
        
        if (firstName) data.firstName = firstName;
        if (lastName) data.lastName = lastName;
        if (firstName && lastName) data.fullName = `${firstName} ${lastName}`;
        
        // Get other fields
        const fieldMappings = {
            gender: 'select',
            dateOfBirth: 'input[type="date"]',
            icNumber: 'input[placeholder*="010203"]',
            mobilePhone: 'input[type="tel"]',
            country: 'input[placeholder*="country"]',
            state: 'input[placeholder*="state"]',
            city: 'input[placeholder*="city"]',
            postcode: 'input[placeholder*="postcode"]',
            addressLine1: 'input[placeholder*="address line 1"]',
            addressLine2: 'input[placeholder*="address line 2"]',
            bankName: 'input[placeholder*="bank name"]',
            bankAccountNumber: 'input[placeholder*="account number"]',
            bankAccountHolder: 'input[placeholder*="account holder"]'
        };
        
        Object.keys(fieldMappings).forEach(key => {
            const element = form.querySelector(fieldMappings[key]);
            if (element && element.value) {
                data[key] = element.value;
            }
        });
        
        return data;
    }

    // Handle photo upload
    async handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showNotification('Image file size must be less than 5MB.', 'error');
            return;
        }

        try {
            this.showNotification('Uploading photo...', 'info');
            
            const result = await firebaseService.uploadProfilePhoto(this.currentUser.uid, file);
            
            if (result.success) {
                // Update profile data
                this.userProfile.profilePhoto = result.url;
                
                // Update UI
                this.updateAvatarImages();
                
                this.showNotification('Profile photo updated successfully!', 'success');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            this.showNotification('Failed to upload photo. Please try again.', 'error');
        }
    }

    // Handle new return creation
    handleNewReturn() {
        // This would open a modal or redirect to a new return form
        this.showNotification('New return feature coming soon!', 'info');
    }

    // Utility methods
    formatDate(date) {
        if (!date) return 'N/A';
        
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-MY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatStatus(status) {
        if (!status) return 'N/A';
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }

    getStatusClass(status) {
        const statusMap = {
            'paid': 'success',
            'approved': 'success',
            'completed': 'success',
            'pending': 'pending',
            'processing': 'pending',
            'deposit_paid': 'pending',
            'failed': 'error',
            'rejected': 'error'
        };
        
        return statusMap[status] || 'pending';
    }

    // UI helper methods (delegate to existing functions if available)
    showNotification(message, type) {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    showConfirmDialog(title, message, callback) {
        if (typeof showConfirmDialog === 'function') {
            showConfirmDialog(title, message, callback);
        } else {
            if (confirm(`${title}\n\n${message}`)) {
                callback();
            }
        }
    }

    showLoadingButton(button) {
        if (typeof showLoadingButton === 'function') {
            showLoadingButton(button);
        }
    }

    hideLoadingButton(button) {
        if (typeof hideLoadingButton === 'function') {
            hideLoadingButton(button);
        }
    }
}

// Initialize Firebase Agent Dashboard
const firebaseAgent = new FirebaseAgentDashboard();

// Export for global access
window.firebaseAgent = firebaseAgent;