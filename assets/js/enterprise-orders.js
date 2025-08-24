/**
 * Enterprise Orders Management JavaScript
 * Handles order CRUD operations, search, filtering, and Shopify integration
 * Now with REAL Shopify API integration
 */

class EnterpriseOrders {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentStatus = '';
        this.currentSort = { column: 'date', direction: 'desc' };
        this.apiBaseUrl = '/api';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTableSorting();
        this.loadOrders();
        this.announceToScreenReader('Order management loaded successfully');
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('order-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        }

        // Pagination controls
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());

        // Form submission
        const addOrderForm = document.getElementById('add-order-form');
        if (addOrderForm) {
            addOrderForm.addEventListener('submit', (e) => this.handleAddOrder(e));
        }

        // Export functionality
        const exportBtn = document.querySelector('button[onclick*="Export"]');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportOrders();
        }
    }

    setupTableSorting() {
        const tableHeaders = document.querySelectorAll('th[data-sortable]');
        tableHeaders.forEach(header => {
            header.addEventListener('click', () => this.sortTable(header));
        });
    }

    sortTable(header) {
        const columnIndex = Array.from(header.parentElement.children).indexOf(header);
        const dataType = header.dataset.type;
        
        // Toggle sort direction
        if (this.currentSort.column === columnIndex) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = columnIndex;
            this.currentSort.direction = 'asc';
        }

        // Remove existing sort classes
        document.querySelectorAll('th[data-sortable]').forEach(h => {
            h.classList.remove('sort-asc', 'sort-desc');
        });
        header.classList.add(this.currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');

        // Sort orders
        this.filteredOrders.sort((a, b) => {
            const aValue = this.getOrderValue(a, columnIndex);
            const bValue = this.getOrderValue(b, columnIndex);

            if (dataType === 'number') {
                const aNum = parseFloat(aValue) || 0;
                const bNum = parseFloat(bValue) || 0;
                return this.currentSort.direction === 'asc' ? aNum - bNum : bNum - aNum;
            } else {
                return this.currentSort.direction === 'asc' ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);
            }
        });

        this.renderOrders();
        this.announceToScreenReader(`Orders sorted by ${header.textContent} in ${this.currentSort.direction} order`);
    }

    getOrderValue(order, columnIndex) {
        switch (columnIndex) {
            case 0: return order.orderId || '';
            case 1: return order.customerName || '';
            case 2: return order.products?.map(p => p.name).join(', ') || '';
            case 3: return order.total || 0;
            case 4: return order.agentName || '';
            case 5: return order.status || '';
            case 6: return order.orderDate || '';
            default: return '';
        }
    }

    async loadOrders() {
        try {
            this.showNotification('Loading orders from Shopify...', 'info');
            
            // Get orders from Shopify API
            const response = await fetch(`${this.apiBaseUrl}/shopify/orders`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.orders = data.orders || data || [];
            this.filteredOrders = [...this.orders];
            
            this.renderOrders();
            this.updatePagination();
            this.showNotification(`${this.orders.length} orders loaded from Shopify`, 'success');
            
        } catch (error) {
            console.error('Error loading orders from Shopify:', error);
            this.showError(`Failed to load orders from Shopify: ${error.message}`);
            
            // Show empty state instead of sample data
            this.orders = [];
            this.filteredOrders = [];
            this.renderOrders();
            this.updatePagination();
        }
    }

    loadSampleOrders() {
        // Fallback sample data if Shopify API fails
        this.orders = [
            {
                id: '1',
                orderId: 'SO-001',
                customerName: 'Sarah Ahmad',
                customerEmail: 'sarah@email.com',
                products: [
                    { id: '1', name: 'Batik Traditional Set', price: 289.00, quantity: 1 }
                ],
                total: 289.00,
                agentId: '1',
                agentName: 'John Doe',
                status: 'completed',
                orderDate: '2024-03-15',
                shippingAddress: 'Kuala Lumpur, Malaysia'
            },
            {
                id: '2',
                orderId: 'SO-002',
                customerName: 'Ali Rahman',
                customerEmail: 'ali@email.com',
                products: [
                    { id: '2', name: 'Batik Modern Design', price: 156.00, quantity: 1 }
                ],
                total: 156.00,
                agentId: '2',
                agentName: 'Jane Smith',
                status: 'processing',
                orderDate: '2024-03-16',
                shippingAddress: 'Penang, Malaysia'
            },
            {
                id: '3',
                orderId: 'SO-003',
                customerName: 'Fatimah Lee',
                customerEmail: 'fatimah@email.com',
                products: [
                    { id: '3', name: 'Batik Premium Collection', price: 425.00, quantity: 1 }
                ],
                total: 425.00,
                agentId: '3',
                agentName: 'Mike Wilson',
                status: 'pending',
                orderDate: '2024-03-17',
                shippingAddress: 'Johor Bahru, Malaysia'
            }
        ];
        this.filteredOrders = [...this.orders];
        this.renderOrders();
        this.updatePagination();
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredOrders = this.currentStatus ? 
                this.orders.filter(o => o.status === this.currentStatus) : 
                [...this.orders];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredOrders = this.orders.filter(order => 
                (this.currentStatus === '' || order.status === this.currentStatus) &&
                (order.orderId.toLowerCase().includes(searchTerm) ||
                 order.customerName.toLowerCase().includes(searchTerm) ||
                 order.customerEmail.toLowerCase().includes(searchTerm))
            );
        }
        
        this.currentPage = 1;
        this.renderOrders();
        this.updatePagination();
    }

    handleStatusFilter(status) {
        this.currentStatus = status;
        
        if (!status) {
            this.filteredOrders = [...this.orders];
        } else {
            this.filteredOrders = this.orders.filter(order => order.status === status);
        }
        
        this.currentPage = 1;
        this.renderOrders();
        this.updatePagination();
    }

    renderOrders() {
        const tbody = document.getElementById('orders-tbody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageOrders = this.filteredOrders.slice(startIndex, endIndex);

        tbody.innerHTML = pageOrders.map(order => this.createOrderRow(order)).join('');
        this.updatePagination();
    }

    createOrderRow(order) {
        return `
            <tr>
                <td style="font-weight: 500; color: var(--primary-600);">${order.orderId}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: var(--space-sm);">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(order.customerName)}&size=32" 
                             style="width: 32px; height: 32px; border-radius: 50%;" alt="">
                        <div>
                            <div style="font-weight: 500;">${order.customerName}</div>
                            <div style="font-size: var(--text-xs); color: var(--neutral-500);">${order.customerEmail}</div>
                        </div>
                    </div>
                </td>
                <td>${this.getProductDetails(order.products)}</td>
                <td style="font-weight: 600;">RM ${order.total.toFixed(2)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: var(--space-sm);">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(order.agentName)}&size=24" 
                             style="width: 24px; height: 24px; border-radius: 50%;" alt="">
                        <span>${order.agentName}</span>
                    </div>
                </td>
                <td><span class="badge ${this.getStatusClass(order.status)}">${this.getStatusIcon(order.status)} ${order.status}</span></td>
                <td>${this.formatDate(order.orderDate)}</td>
                <td>
                    <div style="display: flex; gap: var(--space-xs);">
                        <button class="btn btn-sm btn-ghost" title="View details" onclick="viewOrder('${order.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-ghost" title="Edit order" onclick="editOrder('${order.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-ghost" title="Update status" onclick="updateOrderStatus('${order.id}')">
                            <i class="fas fa-sync"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getProductDetails(products) {
        if (!products || !Array.isArray(products)) return 'N/A';
        return products.map(p => `${p.name} (x${p.quantity})`).join(', ');
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'completed': return 'badge-success';
            case 'processing': return 'badge-warning';
            case 'pending': return 'badge-info';
            case 'cancelled': return 'badge-error';
            case 'shipped': return 'badge-primary';
            default: return 'badge-secondary';
        }
    }

    getStatusIcon(status) {
        switch (status.toLowerCase()) {
            case 'completed': return '<i class="fas fa-check-circle"></i>';
            case 'processing': return '<i class="fas fa-cog"></i>';
            case 'pending': return '<i class="fas fa-clock"></i>';
            case 'cancelled': return '<i class="fas fa-times-circle"></i>';
            case 'shipped': return '<i class="fas fa-truck"></i>';
            default: return '<i class="fas fa-question-circle"></i>';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-MY');
        } catch {
            return dateString;
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredOrders.length);

        // Update pagination info
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const totalOrders = document.getElementById('total-orders');
        const currentPageSpan = document.getElementById('current-page');

        if (showingStart) showingStart.textContent = start;
        if (showingEnd) showingEnd.textContent = end;
        if (totalOrders) totalOrders.textContent = this.filteredOrders.length;
        if (currentPageSpan) currentPageSpan.textContent = this.currentPage;

        // Update pagination controls
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderOrders();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderOrders();
        }
    }

    async handleAddOrder(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const orderData = {
            customerName: formData.get('customerName'),
            customerEmail: formData.get('customerEmail'),
            products: this.getProductDetails(formData.get('products')),
            assignedAgent: formData.get('assignedAgent'),
            status: 'pending'
        };

        try {
            this.showNotification('Creating new order...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/shopify/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newOrder = await response.json();
            
            // Add to local array
            this.orders.unshift(newOrder);
            this.filteredOrders = [...this.orders];
            
            this.renderOrders();
            this.updatePagination();
            this.closeAddOrderModal();
            this.showSuccess(`Order created successfully!`);
            
            // Announce to screen reader
            this.announceToScreenReader(`New order created successfully`);
            
        } catch (error) {
            console.error('Error creating order:', error);
            this.showError(`Failed to create order: ${error.message}`);
        }
    }

    async exportOrders() {
        try {
            this.showNotification('Preparing order export...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/shopify/orders/export`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showSuccess('Orders exported successfully!');
            
        } catch (error) {
            console.error('Error exporting orders:', error);
            this.showError(`Failed to export orders: ${error.message}`);
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

// Global functions for modal and actions
function openAddOrderModal() {
    const modal = document.getElementById('add-order-modal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('customer-name').focus();
    }
}

function closeAddOrderModal() {
    const modal = document.getElementById('add-order-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('add-order-form').reset();
    }
}

async function syncShopifyOrders() {
    try {
        const response = await fetch('/api/shopify/orders/sync', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('enterprise-auth-token') || 'demo-token'}`
            }
        });
        
        if (response.ok) {
            alert('Shopify orders synced successfully!');
            window.location.reload();
        } else {
            alert('Failed to sync Shopify orders');
        }
    } catch (error) {
        alert('Error syncing Shopify orders');
    }
}

async function viewOrder(orderId) {
    try {
        const response = await fetch(`/api/shopify/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('enterprise-auth-token') || 'demo-token'}`
            }
        });
        
        if (response.ok) {
            const order = await response.json();
            alert(`Order Details:\nOrder ID: ${order.orderId}\nCustomer: ${order.customerName}\nEmail: ${order.customerEmail}\nTotal: RM ${order.total}\nStatus: ${order.status}\nDate: ${order.orderDate}`);
        } else {
            alert('Failed to load order details');
        }
    } catch (error) {
        alert('Error loading order details');
    }
}

async function editOrder(orderId) {
    // Redirect to edit page or open edit modal
    window.location.href = `enterprise-orders.html?edit=${orderId}`;
}

async function updateOrderStatus(orderId) {
    try {
        const newStatus = prompt('Enter new status (pending, processing, shipped, completed, cancelled):');
        if (!newStatus) return;
        
        const response = await fetch(`/api/shopify/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('enterprise-auth-token') || 'demo-token'}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            alert('Order status updated successfully!');
            window.location.reload();
        } else {
            alert('Failed to update order status');
        }
    } catch (error) {
        alert('Error updating order status');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnterpriseOrders();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnterpriseOrders;
}

