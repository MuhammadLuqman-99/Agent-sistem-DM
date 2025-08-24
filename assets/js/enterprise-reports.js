/**
 * Enterprise Reports & Analytics JavaScript
 * Handles report generation, chart rendering, and data analysis
 * Now with REAL Firebase data integration
 */

class EnterpriseReports {
    constructor() {
        this.currentFilters = {
            dateRange: '30d',
            category: 'all',
            agent: 'all'
        };
        this.apiBaseUrl = '/api';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadReportData();
        this.announceToScreenReader('Reports and analytics loaded successfully');
    }

    setupEventListeners() {
        // Filter controls
        const dateRangeFilter = document.getElementById('date-range-filter');
        const categoryFilter = document.getElementById('category-filter');
        const agentFilter = document.getElementById('agent-filter');

        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => this.updateFilter('dateRange', e.target.value));
        }
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.updateFilter('category', e.target.value));
        }
        if (agentFilter) {
            agentFilter.addEventListener('change', (e) => this.updateFilter('agent', e.target.value));
        }

        // Export functionality
        const exportBtn = document.querySelector('button[onclick*="Export"]');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportReport();
        }
    }

    updateFilter(key, value) {
        this.currentFilters[key] = value;
        this.loadReportData();
    }

    async loadReportData() {
        try {
            this.showNotification('Loading report data...', 'info');
            
            // Get analytics data from Firebase
            const response = await fetch(`${this.apiBaseUrl}/analytics/reports`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.currentFilters)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Initialize charts with real data
            this.initializeCharts(data);
            this.loadTopProducts(data.topProducts);
            this.loadAgentPerformance(data.agentPerformance);
            
            this.showNotification('Report data loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error loading report data:', error);
            this.showError(`Failed to load report data: ${error.message}`);
            
            // Show empty state instead of sample data
            this.showError('Failed to load reports data. Please try again later.');
        }
    }

    loadSampleData() {
        // Fallback sample data if Firebase API fails
        const sampleData = {
            salesTrend: [
                { date: '2024-03-01', sales: 12500, orders: 45 },
                { date: '2024-03-02', sales: 15800, orders: 52 },
                { date: '2024-03-03', sales: 14200, orders: 48 },
                { date: '2024-03-04', sales: 18900, orders: 61 },
                { date: '2024-03-05', sales: 16700, orders: 55 },
                { date: '2024-03-06', sales: 20300, orders: 68 },
                { date: '2024-03-07', sales: 17800, orders: 59 }
            ],
            customerSegments: [
                { segment: 'Premium', count: 125, percentage: 25 },
                { segment: 'Regular', count: 225, percentage: 45 },
                { segment: 'Occasional', count: 150, percentage: 30 }
            ],
            geographicData: [
                { region: 'Kuala Lumpur', sales: 45000, orders: 150 },
                { region: 'Penang', sales: 32000, orders: 110 },
                { region: 'Johor', sales: 28000, orders: 95 },
                { region: 'Perak', sales: 22000, orders: 75 },
                { region: 'Others', sales: 18000, orders: 60 }
            ],
            topProducts: [
                { name: 'Batik Traditional Set', sales: 28900, units: 100 },
                { name: 'Batik Modern Design', sales: 23400, units: 150 },
                { name: 'Batik Premium Collection', sales: 21250, units: 50 },
                { name: 'Batik Casual Wear', sales: 17800, units: 200 },
                { name: 'Batik Sarong Traditional', sales: 15800, units: 80 }
            ],
            agentPerformance: [
                { name: 'John Doe', sales: 125000, orders: 156, commission: 12500 },
                { name: 'Jane Smith', sales: 98000, orders: 142, commission: 9800 },
                { name: 'Mike Wilson', sales: 89000, orders: 135, commission: 8900 },
                { name: 'Sarah Ahmad', sales: 76000, orders: 98, commission: 7600 },
                { name: 'Ali Rahman', sales: 68000, orders: 87, commission: 6800 }
            ]
        };

        this.initializeCharts(sampleData);
        this.loadTopProducts(sampleData.topProducts);
        this.loadAgentPerformance(sampleData.agentPerformance);
    }

    initializeCharts(data) {
        this.initializeSalesTrendChart(data.salesTrend);
        this.initializeCustomerSegmentsChart(data.customerSegments);
        this.initializeGeographicChart(data.geographicData);
    }

    initializeSalesTrendChart(salesData) {
        const ctx = document.getElementById('sales-trend-chart');
        if (!ctx) {
            this.showChartFallback('sales-trend-chart');
            return;
        }

        try {
            if (window.salesTrendChart) {
                window.salesTrendChart.destroy();
            }

            window.salesTrendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: salesData.map(item => new Date(item.date).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })),
                    datasets: [
                        {
                            label: 'Sales (RM)',
                            data: salesData.map(item => item.sales),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Orders',
                            data: salesData.map(item => item.orders),
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
                            text: 'Sales Trend (Last 7 Days)'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating sales trend chart:', error);
            this.showChartFallback('sales-trend-chart');
        }
    }

    initializeCustomerSegmentsChart(segmentsData) {
        const ctx = document.getElementById('customer-segments-chart');
        if (!ctx) {
            this.showChartFallback('customer-segments-chart');
            return;
        }

        try {
            if (window.customerSegmentsChart) {
                window.customerSegmentsChart.destroy();
            }

            window.customerSegmentsChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: segmentsData.map(item => item.segment),
                    datasets: [{
                        data: segmentsData.map(item => item.count),
                        backgroundColor: [
                            'rgb(59, 130, 246)',
                            'rgb(16, 185, 129)',
                            'rgb(245, 158, 11)'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        title: {
                            display: true,
                            text: 'Customer Segments'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating customer segments chart:', error);
            this.showChartFallback('customer-segments-chart');
        }
    }

    initializeGeographicChart(geoData) {
        const ctx = document.getElementById('geographic-chart');
        if (!ctx) {
            this.showChartFallback('geographic-chart');
            return;
        }

        try {
            if (window.geographicChart) {
                window.geographicChart.destroy();
            }

            window.geographicChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: geoData.map(item => item.region),
                    datasets: [
                        {
                            label: 'Sales (RM)',
                            data: geoData.map(item => item.sales),
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderColor: 'rgb(59, 130, 246)',
                            borderWidth: 1
                        },
                        {
                            label: 'Orders',
                            data: geoData.map(item => item.orders),
                            backgroundColor: 'rgba(16, 185, 129, 0.8)',
                            borderColor: 'rgb(16, 185, 129)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Value'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Region'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Geographic Distribution'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating geographic chart:', error);
            this.showChartFallback('geographic-chart');
        }
    }

    showChartFallback(chartId) {
        const chartContainer = document.getElementById(chartId);
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

    loadTopProducts(products) {
        const container = document.getElementById('top-products-list');
        if (!container || !products) return;

        container.innerHTML = products.map((product, index) => `
            <div class="top-product-item">
                <div class="product-rank">#${index + 1}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-stats">
                        <span class="sales">RM ${product.sales.toLocaleString()}</span>
                        <span class="units">${product.units} units</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadAgentPerformance(agents) {
        const tbody = document.getElementById('agent-performance-tbody');
        if (!tbody || !agents) return;

        tbody.innerHTML = agents.map(agent => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: var(--space-sm);">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&size=32" 
                             style="width: 32px; height: 32px; border-radius: 50%;" alt="">
                        <span style="font-weight: 500;">${agent.name}</span>
                    </div>
                </td>
                <td style="font-weight: 600; color: var(--success-600);">RM ${agent.sales.toLocaleString()}</td>
                <td style="font-weight: 600;">${agent.orders}</td>
                <td style="font-weight: 600; color: var(--primary-600);">RM ${agent.commission.toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-ghost" onclick="viewAgentDetails('${agent.name}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async exportReport() {
        try {
            this.showNotification('Preparing report export...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/analytics/export`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.currentFilters)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `enterprise-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showSuccess('Report exported successfully!');
            
        } catch (error) {
            console.error('Error exporting report:', error);
            this.showError(`Failed to export report: ${error.message}`);
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

// Global functions for report actions
function applyFilters() {
    // This will be handled by the class methods
    console.log('Filters applied');
}

function resetFilters() {
    // Reset all filters to default
    const dateRangeFilter = document.getElementById('date-range-filter');
    const categoryFilter = document.getElementById('category-filter');
    const agentFilter = document.getElementById('agent-filter');

    if (dateRangeFilter) dateRangeFilter.value = '30d';
    if (categoryFilter) categoryFilter.value = 'all';
    if (agentFilter) agentFilter.value = 'all';

    // Reload data with default filters
    if (window.enterpriseReports) {
        window.enterpriseReports.currentFilters = {
            dateRange: '30d',
            category: 'all',
            agent: 'all'
        };
        window.enterpriseReports.loadReportData();
    }
}

function generateReport() {
    if (window.enterpriseReports) {
        window.enterpriseReports.exportReport();
    }
}

function exportData() {
    if (window.enterpriseReports) {
        window.enterpriseReports.exportReport();
    }
}

function toggleChartView(chartType) {
    // Toggle between different chart views
    console.log(`Switching to ${chartType} view`);
}

function sortAgentsBy(criteria) {
    // Sort agent performance table
    console.log(`Sorting agents by ${criteria}`);
}

function viewAgentDetails(agentName) {
    // Show detailed agent performance
    alert(`Agent Details for ${agentName}\n\nThis would show detailed performance metrics, sales history, and customer interactions in a real application.`);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enterpriseReports = new EnterpriseReports();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnterpriseReports;
}
