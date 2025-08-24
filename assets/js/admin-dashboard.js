/**
 * Enterprise Admin Dashboard JavaScript
 * Handles dashboard functionality, charts, and interactions
 * Now with REAL API integration (Firebase + Shopify)
 */

class AdminDashboard {
    constructor() {
        this.dashboardData = null;
        this.apiBaseUrl = '/api';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTableSorting();
        this.initializeCharts();
        this.loadDashboardData();
        this.announceToScreenReader('Admin dashboard loaded successfully');
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Navigation
        const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Quick actions
        const quickActionButtons = document.querySelectorAll('[data-action]');
        quickActionButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleQuickAction(e));
        });

        // Table sorting
        const sortableHeaders = document.querySelectorAll('th[data-sortable]');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => this.sortTable(header));
        });

        // Refresh button
        const refreshBtn = document.querySelector('button[onclick*="reload"]');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.refreshDashboard();
        }
    }

    setupTableSorting() {
        const tableHeaders = document.querySelectorAll('th[data-sortable]');
        tableHeaders.forEach(header => {
            header.addEventListener('click', () => this.sortTable(header));
        });
    }

    sortTable(header) {
        const table = header.closest('table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const columnIndex = Array.from(header.parentElement.children).indexOf(header);
        const dataType = header.dataset.type;
        
        // Toggle sort direction
        const isAscending = !header.classList.contains('sort-desc');
        
        // Remove existing sort classes
        table.querySelectorAll('th[data-sortable]').forEach(h => {
            h.classList.remove('sort-asc', 'sort-desc');
        });
        header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');

        // Sort rows
        rows.sort((a, b) => {
            const aValue = this.getTableValue(a, columnIndex);
            const bValue = this.getTableValue(b, columnIndex);

            if (dataType === 'number') {
                const aNum = parseFloat(aValue) || 0;
                const bNum = parseFloat(bValue) || 0;
                return isAscending ? aNum - bNum : bNum - aNum;
            } else {
                return isAscending ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);
            }
        });

        // Reorder rows
        rows.forEach(row => tbody.appendChild(row));
        
        this.announceToScreenReader(`Table sorted by ${header.textContent} in ${isAscending ? 'ascending' : 'descending'} order`);
    }

    getTableValue(row, columnIndex) {
        const cell = row.children[columnIndex];
        if (!cell) return '';
        
        // Handle different cell content types
        if (cell.querySelector('.badge')) {
            return cell.querySelector('.badge').textContent.trim();
        }
        if (cell.querySelector('img')) {
            return cell.querySelector('img').alt || '';
        }
        return cell.textContent.trim();
    }

    initializeCharts() {
        this.initializeSalesChart();
    }

    async initializeSalesChart() {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) {
            this.showChartFallback();
            return;
        }

        try {
            // Get sales data from API
            const response = await fetch(`${this.apiBaseUrl}/analytics/sales-trend`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            let chartData;
            if (response.ok) {
                const data = await response.json();
                chartData = data.salesData || data;
            } else {
                            // Show error instead of sample data
            this.showError('Failed to load sales data. Please try again later.');
            return;
            }

            if (window.salesChart) {
                window.salesChart.destroy();
            }

            window.salesChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.map(item => new Date(item.date).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })),
                    datasets: [
                        {
                            label: 'Sales (RM)',
                            data: chartData.map(item => item.sales),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Orders',
                            data: chartData.map(item => item.orders),
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Sales (RM)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Orders'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Sales Performance (Last 7 Days)'
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error creating sales chart:', error);
            this.showChartFallback();
        }
    }

    getSampleSalesData() {
        // Fallback sample data if API fails
        return [
            { date: '2024-03-01', sales: 12500, orders: 45 },
            { date: '2024-03-02', sales: 15800, orders: 52 },
            { date: '2024-03-03', sales: 14200, orders: 48 },
            { date: '2024-03-04', sales: 18900, orders: 61 },
            { date: '2024-03-05', sales: 16700, orders: 55 },
            { date: '2024-03-06', sales: 20300, orders: 68 },
            { date: '2024-03-07', sales: 17800, orders: 59 }
        ];
    }

    showChartFallback() {
        const chartContainer = document.getElementById('sales-chart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 300px; background: var(--neutral-100); border-radius: var(--radius-md);">
                    <div style="text-align: center; color: var(--neutral-500);">
                        <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: var(--space-md);"></i>
                        <p>Chart data unavailable</p>
                        <p style="font-size: var(--text-sm);">Please check your data connection</p>
                    </div>
                </div>
            `;
        }
    }

    async loadDashboardData() {
        try {
            this.showNotification('Loading dashboard data...', 'info');
            
            // Get dashboard data from API
            const response = await fetch(`${this.apiBaseUrl}/dashboard/overview`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.dashboardData = data;
            
            this.updateDashboardStats();
            this.showNotification('Dashboard data loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError(`Failed to load dashboard data: ${error.message}`);
            
            // Fallback to sample data if API fails
            this.loadSampleDashboardData();
        }
    }

    loadSampleDashboardData() {
        // Fallback sample data if API fails
        this.dashboardData = {
            stats: {
                totalSales: 125000,
                totalOrders: 450,
                activeAgents: 12,
                totalProducts: 89
            },
            recentOrders: [
                {
                    id: '1',
                    orderId: 'SO-001',
                    customer: 'Sarah Ahmad',
                    amount: 289.00,
                    status: 'completed',
                    date: '2024-03-15'
                },
                {
                    id: '2',
                    orderId: 'SO-002',
                    customer: 'Ali Rahman',
                    amount: 156.00,
                    status: 'processing',
                    date: '2024-03-16'
                },
                {
                    id: '3',
                    orderId: 'SO-003',
                    customer: 'Fatimah Lee',
                    amount: 425.00,
                    status: 'pending',
                    date: '2024-03-17'
                }
            ]
        };
        
        this.updateDashboardStats();
    }

    updateDashboardStats() {
        if (!this.dashboardData) return;

        // Update quick stats
        const totalSales = document.getElementById('total-sales');
        const totalOrders = document.getElementById('total-orders');
        const activeAgents = document.getElementById('active-agents');
        const totalProducts = document.getElementById('total-products');

        if (totalSales) totalSales.textContent = `RM ${this.dashboardData.stats.totalSales.toLocaleString()}`;
        if (totalOrders) totalOrders.textContent = this.dashboardData.stats.totalOrders.toLocaleString();
        if (activeAgents) activeAgents.textContent = this.dashboardData.stats.activeAgents.toLocaleString();
        if (totalProducts) totalProducts.textContent = this.dashboardData.stats.totalProducts.toLocaleString();
    }

    handleNavigation(event) {
        const link = event.currentTarget;
        const href = link.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            event.preventDefault();
            const sectionName = href.substring(1);
            this.showSection(sectionName);
        }
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update active navigation
        const navLinks = document.querySelectorAll('.sidebar-nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        event.currentTarget.classList.add('active');

        this.announceToScreenReader(`${sectionName} section displayed`);
    }

    handleQuickAction(event) {
        const action = event.currentTarget.dataset.action;
        
        switch (action) {
            case 'view-agents':
                window.location.href = 'enterprise-agents.html';
                break;
            case 'view-products':
                window.location.href = 'enterprise-products.html';
                break;
            case 'view-orders':
                window.location.href = 'enterprise-orders.html';
                break;
            case 'view-reports':
                window.location.href = 'enterprise-reports.html';
                break;
            default:
                console.log(`Quick action: ${action}`);
        }
    }

    async refreshDashboard() {
        try {
            this.showNotification('Refreshing dashboard...', 'info');
            await this.loadDashboardData();
            this.initializeSalesChart();
            this.showSuccess('Dashboard refreshed successfully');
        } catch (error) {
            this.showError('Failed to refresh dashboard');
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('enterprise-theme', newTheme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        this.announceToScreenReader(`Theme switched to ${newTheme} mode`);
    }

    setupThemeToggle() {
        const savedTheme = localStorage.getItem('enterprise-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    getAuthToken() {
        // Get JWT token from localStorage or sessionStorage
        const token = localStorage.getItem('enterprise-auth-token') || 
               sessionStorage.getItem('enterprise-auth-token');
        
        if (!token) {
            // Redirect to login if no token
            window.location.href = '/login';
            return null;
        }
        
        return token;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    announceToScreenReader(message) {
        const srStatus = document.getElementById('sr-status');
        if (srStatus) {
            srStatus.textContent = message;
            setTimeout(() => {
                srStatus.textContent = '';
            }, 1000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}
