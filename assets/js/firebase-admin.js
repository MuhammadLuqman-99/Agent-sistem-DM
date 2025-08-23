// Firebase Admin Dashboard Integration
import firebaseService from '../../services/firebase-service.js';
import migrationService from '../../services/migration-service.js';

class FirebaseAdminDashboard {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.allUsers = [];
        this.allSales = [];
        this.allReturns = [];
        this.adminStats = {};
        
        this.init();
    }

    async init() {
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

            // Check if user is admin
            if (!firebaseService.isAdmin()) {
                window.location.href = 'firebase-login.html';
                return;
            }

            this.currentUser = firebaseService.getCurrentUser();
            
            // Load admin profile
            await this.loadUserProfile();
            
            // Check if migration is needed
            if (migrationService.isMigrationNeeded()) {
                await this.performDataMigration();
            }
            
            // Load all data for admin dashboard
            await this.loadAdminData();
            this.initializeUI();
            this.setupEventListeners();
            
            console.log('Firebase Admin Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Admin dashboard initialization error:', error);
            this.showNotification('Failed to load admin dashboard. Please refresh the page.', 'error');
        }
    }

    // Load admin profile from Firebase
    async loadUserProfile() {
        try {
            this.userProfile = await firebaseService.getUserProfile(this.currentUser.uid);
            
            if (this.userProfile) {
                this.updateUIWithProfile();
            } else {
                console.warn('Admin profile not found');
            }
            
        } catch (error) {
            console.error('Error loading admin profile:', error);
        }
    }

    // Update UI with admin profile data
    updateUIWithProfile() {
        if (!this.userProfile) return;

        // Update profile name in header
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = this.userProfile.fullName || 'Admin User';
        }

        // Update any other admin-specific profile elements
        const adminName = document.querySelector('.admin-name');
        if (adminName) {
            adminName.textContent = this.userProfile.fullName || 'Admin User';
        }

        // Update avatar if custom photo exists
        if (this.userProfile.profilePhoto) {
            const profileImages = document.querySelectorAll('[src*="ui-avatars.com"]');
            profileImages.forEach(img => {
                img.src = this.userProfile.profilePhoto;
            });
        }
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

    // Load all data for admin dashboard
    async loadAdminData() {
        try {
            // Load all users
            this.allUsers = await firebaseService.getAllUsers();
            
            // Load all sales
            this.allSales = await firebaseService.getAllSales();
            
            // Load all returns
            this.allReturns = await firebaseService.getAllReturns();
            
            // Get admin statistics
            this.adminStats = await firebaseService.getAdminStats();
            
            // Update dashboard UI with data
            this.updateAdminDashboardUI();
            
        } catch (error) {
            console.error('Error loading admin data:', error);
            this.showNotification('Failed to load admin data', 'error');
        }
    }

    // Update admin dashboard UI with Firebase data
    updateAdminDashboardUI() {
        // Update stats cards
        this.updateAdminStatsCards();
        
        // Update users table if on users management page
        if (window.location.pathname.includes('users.html') || 
            window.location.pathname.includes('agents.html')) {
            this.updateUsersTable();
        }
        
        // Update sales table if on sales management page
        if (window.location.pathname.includes('sales.html')) {
            this.updateAllSalesTable();
        }
        
        // Update returns table if on returns management page  
        if (window.location.pathname.includes('returns.html')) {
            this.updateAllReturnsTable();
        }

        // Update dashboard charts and statistics
        this.updateDashboardCharts();
    }

    // Update admin stats cards
    updateAdminStatsCards() {
        const statsElements = {
            totalUsers: document.querySelector('[data-stat="total-users"]'),
            totalAgents: document.querySelector('[data-stat="total-agents"]'),
            totalSales: document.querySelector('[data-stat="total-sales"]'),
            totalRevenue: document.querySelector('[data-stat="total-revenue"]'),
            totalReturns: document.querySelector('[data-stat="total-returns"]'),
            pendingSales: document.querySelector('[data-stat="pending-sales"]')
        };

        if (statsElements.totalUsers) {
            statsElements.totalUsers.textContent = this.adminStats.totalUsers || 0;
        }
        
        if (statsElements.totalAgents) {
            statsElements.totalAgents.textContent = this.adminStats.totalAgents || 0;
        }
        
        if (statsElements.totalSales) {
            statsElements.totalSales.textContent = this.adminStats.totalSales || 0;
        }
        
        if (statsElements.totalRevenue) {
            statsElements.totalRevenue.textContent = `RM${(this.adminStats.totalRevenue || 0).toFixed(2)}`;
        }
        
        if (statsElements.totalReturns) {
            statsElements.totalReturns.textContent = this.adminStats.totalReturns || 0;
        }
        
        if (statsElements.pendingSales) {
            statsElements.pendingSales.textContent = this.adminStats.pendingSales || 0;
        }

        // Update dashboard main stats
        const mainStats = document.querySelectorAll('.stat-card .stat-number');
        if (mainStats.length >= 4) {
            mainStats[0].textContent = this.adminStats.totalSales || 0;
            mainStats[1].textContent = `RM${((this.adminStats.totalRevenue || 0) / 1000).toFixed(1)}K`;
            mainStats[2].textContent = this.adminStats.totalAgents || 0;
            mainStats[3].textContent = this.adminStats.totalReturns || 0;
        }
    }

    // Update users table for admin
    updateUsersTable() {
        const tbody = document.querySelector('table tbody');
        if (!tbody || !this.allUsers.length) return;

        tbody.innerHTML = '';
        
        this.allUsers.forEach(user => {
            const row = document.createElement('tr');
            const joinDate = this.formatDate(user.createdAt);
            const lastLogin = this.formatDate(user.lastLogin);
            
            row.innerHTML = `
                <td>${user.fullName || user.firstName + ' ' + user.lastName || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td><span class="role-badge ${user.role}">${this.formatRole(user.role)}</span></td>
                <td>${user.mobilePhone || 'N/A'}</td>
                <td>${user.state || 'N/A'}</td>
                <td>${joinDate}</td>
                <td>${lastLogin}</td>
                <td><span class="status-badge success">Active</span></td>
                <td>
                    <div class="action-buttons">
                        <a href="#" class="action-btn btn-view" onclick="viewUser('${user.id}')"><i class="fas fa-eye"></i> View</a>
                        <a href="#" class="action-btn btn-edit" onclick="editUser('${user.id}')"><i class="fas fa-edit"></i> Edit</a>
                        ${user.role !== 'admin' ? `<a href="#" class="action-btn btn-delete" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i> Delete</a>` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Update all sales table for admin
    updateAllSalesTable() {
        const tbody = document.querySelector('table tbody');
        if (!tbody || !this.allSales.length) return;

        tbody.innerHTML = '';
        
        this.allSales.forEach(sale => {
            // Get agent name
            const agent = this.allUsers.find(u => u.id === sale.agentId);
            const agentName = agent ? (agent.fullName || agent.firstName + ' ' + agent.lastName) : 'N/A';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.invoiceNumber || 'N/A'}</td>
                <td>${agentName}</td>
                <td>${sale.customerName || 'N/A'}</td>
                <td>${this.formatDate(sale.orderDate || sale.createdAt)}</td>
                <td>RM${(sale.total || 0).toFixed(2)}</td>
                <td><span class="status-badge ${this.getStatusClass(sale.paymentStatus)}">${this.formatStatus(sale.paymentStatus)}</span></td>
                <td>${sale.paymentMethod || 'N/A'}</td>
                <td><span class="status-badge ${this.getStatusClass(sale.status)}">${this.formatStatus(sale.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <a href="#" class="action-btn btn-view" onclick="viewSale('${sale.id}')"><i class="fas fa-eye"></i> View</a>
                        <a href="#" class="action-btn btn-edit" onclick="updateSaleStatus('${sale.id}', 'approved')"><i class="fas fa-check"></i> Approve</a>
                        <a href="#" class="action-btn btn-delete" onclick="updateSaleStatus('${sale.id}', 'rejected')"><i class="fas fa-times"></i> Reject</a>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Update all returns table for admin
    updateAllReturnsTable() {
        const tbody = document.querySelector('table tbody');
        if (!tbody || !this.allReturns.length) return;

        tbody.innerHTML = '';
        
        this.allReturns.forEach(returnItem => {
            // Get agent name
            const agent = this.allUsers.find(u => u.id === returnItem.agentId);
            const agentName = agent ? (agent.fullName || agent.firstName + ' ' + agent.lastName) : 'N/A';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${returnItem.returnNumber || 'N/A'}</td>
                <td>${returnItem.invoiceNumber || 'N/A'}</td>
                <td>${agentName}</td>
                <td>${returnItem.customerName || 'N/A'}</td>
                <td>${this.formatDate(returnItem.date || returnItem.createdAt)}</td>
                <td><span class="status-badge ${this.getStatusClass(returnItem.returnStatus)}">${this.formatStatus(returnItem.returnStatus)}</span></td>
                <td>RM${(returnItem.total || 0).toFixed(2)}</td>
                <td>${returnItem.reason || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <a href="#" class="action-btn btn-view" onclick="viewReturn('${returnItem.id}')"><i class="fas fa-eye"></i> View</a>
                        <a href="#" class="action-btn btn-edit" onclick="updateReturnStatus('${returnItem.id}', 'approved')"><i class="fas fa-check"></i> Approve</a>
                        <a href="#" class="action-btn btn-delete" onclick="updateReturnStatus('${returnItem.id}', 'rejected')"><i class="fas fa-times"></i> Reject</a>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Update dashboard charts and visualizations
    updateDashboardCharts() {
        // This would integrate with chart libraries like Chart.js
        // For now, we'll update basic metrics displays
        
        // Calculate monthly trends
        const currentMonth = new Date().getMonth();
        const currentMonthSales = this.allSales.filter(sale => {
            const saleDate = new Date(sale.createdAt);
            return saleDate.getMonth() === currentMonth;
        });

        const monthlyRevenue = currentMonthSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const monthlyGrowth = this.calculateGrowthRate();

        // Update growth indicators
        const growthElements = document.querySelectorAll('.growth-indicator');
        growthElements.forEach(element => {
            element.textContent = `+${monthlyGrowth.toFixed(1)}%`;
        });

        // Update trend charts data (placeholder for actual chart implementation)
        console.log('Dashboard metrics:', {
            totalRevenue: this.adminStats.totalRevenue,
            monthlyRevenue,
            monthlyGrowth,
            totalUsers: this.adminStats.totalUsers,
            totalSales: this.adminStats.totalSales
        });
    }

    // Calculate growth rate (placeholder calculation)
    calculateGrowthRate() {
        // Simple calculation - would be more sophisticated in real implementation
        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth - 1;
        
        const currentMonthSales = this.allSales.filter(sale => {
            const saleDate = new Date(sale.createdAt);
            return saleDate.getMonth() === currentMonth;
        }).length;

        const lastMonthSales = this.allSales.filter(sale => {
            const saleDate = new Date(sale.createdAt);
            return saleDate.getMonth() === lastMonth;
        }).length;

        if (lastMonthSales === 0) return 0;
        return ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100;
    }

    // Initialize UI components
    initializeUI() {
        // Initialize any existing dashboard functionality
        console.log('Admin UI initialized with Firebase data');
    }

    // Setup event listeners for admin Firebase integration
    setupEventListeners() {
        // Sale status update listeners
        window.updateSaleStatus = async (saleId, status) => {
            await this.updateSaleStatus(saleId, status);
        };

        // Return status update listeners
        window.updateReturnStatus = async (returnId, status) => {
            await this.updateReturnStatus(returnId, status);
        };

        // User management listeners
        window.viewUser = (userId) => this.viewUser(userId);
        window.editUser = (userId) => this.editUser(userId);
        window.deleteUser = (userId) => this.deleteUser(userId);

        // Export functionality
        const exportButtons = document.querySelectorAll('.btn-export, [onclick*="export"]');
        exportButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDataExport();
            });
        });
    }

    // Update sale status
    async updateSaleStatus(saleId, status) {
        try {
            const result = await firebaseService.updateSaleStatus(saleId, status);
            
            if (result.success) {
                this.showNotification(`Sale ${status} successfully!`, 'success');
                
                // Reload data
                await this.loadAdminData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Update sale status error:', error);
            this.showNotification('Failed to update sale status.', 'error');
        }
    }

    // Update return status
    async updateReturnStatus(returnId, status) {
        try {
            const result = await firebaseService.updateReturnStatus(returnId, status);
            
            if (result.success) {
                this.showNotification(`Return ${status} successfully!`, 'success');
                
                // Reload data
                await this.loadAdminData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Update return status error:', error);
            this.showNotification('Failed to update return status.', 'error');
        }
    }

    // View user details
    viewUser(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (user) {
            // This would open a modal or redirect to user detail page
            alert(`User Details:\nName: ${user.fullName}\nEmail: ${user.email}\nRole: ${user.role}`);
        }
    }

    // Edit user
    editUser(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (user) {
            // This would open an edit modal or redirect to edit page
            this.showNotification('Edit user feature coming soon!', 'info');
        }
    }

    // Delete user
    async deleteUser(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return;

        if (confirm(`Are you sure you want to delete ${user.fullName}?`)) {
            try {
                // Implementation would delete user from Firebase
                this.showNotification('Delete user feature coming soon!', 'info');
            } catch (error) {
                console.error('Delete user error:', error);
                this.showNotification('Failed to delete user.', 'error');
            }
        }
    }

    // Handle data export
    handleDataExport() {
        this.showNotification('Preparing export...', 'info');
        
        // Determine what data to export based on current page
        let exportData = [];
        let filename = 'export.csv';
        
        if (window.location.pathname.includes('users.html')) {
            exportData = this.allUsers;
            filename = 'users_export.csv';
        } else if (window.location.pathname.includes('sales.html')) {
            exportData = this.allSales;
            filename = 'sales_export.csv';
        } else if (window.location.pathname.includes('returns.html')) {
            exportData = this.allReturns;
            filename = 'returns_export.csv';
        } else {
            // Export summary data
            exportData = [{
                totalUsers: this.adminStats.totalUsers,
                totalAgents: this.adminStats.totalAgents,
                totalSales: this.adminStats.totalSales,
                totalRevenue: this.adminStats.totalRevenue,
                totalReturns: this.adminStats.totalReturns,
                exportDate: new Date().toISOString()
            }];
            filename = 'dashboard_summary.csv';
        }
        
        this.exportToCSV(exportData, filename);
    }

    // Export data to CSV
    exportToCSV(data, filename) {
        if (!data.length) {
            this.showNotification('No data to export.', 'warning');
            return;
        }
        
        // Convert data to CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    JSON.stringify(row[header] || '')
                ).join(',')
            )
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        this.showNotification('Data exported successfully!', 'success');
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

    formatRole(role) {
        const roleMap = {
            'admin': 'Administrator',
            'agent': 'Sales Agent',
            'user': 'User'
        };
        return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
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

    // UI helper methods
    showNotification(message, type) {
        // Use existing notification system or create simple alert
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            // Simple notification for demo
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize Firebase Admin Dashboard
const firebaseAdmin = new FirebaseAdminDashboard();

// Export for global access
window.firebaseAdmin = firebaseAdmin;