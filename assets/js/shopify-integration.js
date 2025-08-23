// Shopify Integration for Frontend
class ShopifyIntegration {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.orders = [];
    this.products = [];
    this.customers = [];
    this.isLoading = false;
    this.currentUser = this.getCurrentUser();
  }

  getCurrentUser() {
    return {
      id: localStorage.getItem('userId'),
      role: localStorage.getItem('userRole'),
      name: localStorage.getItem('userName')
    };
  }

  // Orders Management
  async fetchShopifyOrders(params = {}) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading('Fetching orders from Shopify...');

    try {
      const queryParams = new URLSearchParams({
        limit: params.limit || 50,
        status: params.status || 'any',
        ...params
      });

      const response = await fetch(`${this.apiBase}/shopify/orders?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        this.orders = data.data;
        this.updateOrdersTable();
        this.updateOrdersStats();
        this.hideLoading();
        this.showNotification(`Loaded ${data.count} orders from Shopify`, 'success');
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      this.hideLoading();
      this.showNotification('Failed to fetch orders from Shopify: ' + error.message, 'error');
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  async assignOrderToAgent(orderId, agentId = null) {
    try {
      const assigneeId = agentId || this.currentUser.id;
      
      if (!assigneeId) {
        throw new Error('No agent ID available');
      }

      const response = await fetch(`${this.apiBase}/shopify/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          agentId: assigneeId,
          assignedBy: this.currentUser.id
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification('Order assigned successfully!', 'success');
        // Refresh orders to show updated assignment
        await this.fetchShopifyOrders();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error assigning order:', error);
      this.showNotification('Failed to assign order: ' + error.message, 'error');
    }
  }

  async getAgentOrders(agentId = null) {
    try {
      const targetAgentId = agentId || this.currentUser.id;
      
      const response = await fetch(`${this.apiBase}/agents/${targetAgentId}/orders`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching agent orders:', error);
      this.showNotification('Failed to fetch agent orders: ' + error.message, 'error');
      return [];
    }
  }

  async getAgentCommissions(agentId = null, startDate = null, endDate = null) {
    try {
      const targetAgentId = agentId || this.currentUser.id;
      let url = `${this.apiBase}/agents/${targetAgentId}/commissions`;
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching agent commissions:', error);
      this.showNotification('Failed to fetch commissions: ' + error.message, 'error');
      return [];
    }
  }

  async getAgentStats(agentId = null) {
    try {
      const targetAgentId = agentId || this.currentUser.id;
      
      const response = await fetch(`${this.apiBase}/agents/${targetAgentId}/stats`);
      const data = await response.json();

      if (data.success) {
        this.updateStatsCards(data.data);
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      this.showNotification('Failed to fetch statistics: ' + error.message, 'error');
      return null;
    }
  }

  // Products Management
  async fetchShopifyProducts(params = {}) {
    this.showLoading('Fetching products from Shopify...');

    try {
      const queryParams = new URLSearchParams({
        limit: params.limit || 50,
        status: params.status || 'active',
        ...params
      });

      const response = await fetch(`${this.apiBase}/shopify/products?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        this.products = data.data;
        this.updateProductsTable();
        this.hideLoading();
        this.showNotification(`Loaded ${data.count} products from Shopify`, 'success');
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      this.hideLoading();
      this.showNotification('Failed to fetch products: ' + error.message, 'error');
      return [];
    }
  }

  // Sync Operations
  async manualSyncOrders() {
    this.showLoading('Syncing orders from Shopify...');

    try {
      const response = await fetch(`${this.apiBase}/shopify/sync/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 100 })
      });

      const data = await response.json();

      if (data.success) {
        this.hideLoading();
        this.showNotification(data.message, 'success');
        // Refresh the orders display
        await this.fetchShopifyOrders();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error syncing orders:', error);
      this.hideLoading();
      this.showNotification('Failed to sync orders: ' + error.message, 'error');
    }
  }

  // UI Update Methods
  updateOrdersTable() {
    const tableBody = document.querySelector('#shopify-orders-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (this.orders.length === 0) {
      const row = tableBody.insertRow();
      row.innerHTML = `
        <td colspan="6" style="text-align: center; color: #6c757d; padding: 2rem;">
          No orders found. <a href="#" onclick="shopifyIntegration.fetchShopifyOrders()">Refresh</a> to load from Shopify.
        </td>
      `;
      return;
    }

    this.orders.forEach(order => {
      const row = tableBody.insertRow();
      row.innerHTML = `
        <td>${order.orderNumber || order.name}</td>
        <td>${this.formatCustomerName(order.customer)}</td>
        <td>${order.currency} ${order.total.toFixed(2)}</td>
        <td><span class="status-badge ${this.getStatusClass(order.financialStatus)}">${this.formatStatus(order.financialStatus)}</span></td>
        <td>${order.assignedAgent || '<span style="color: #dc3545;">Unassigned</span>'}</td>
        <td>
          <div class="action-buttons">
            ${!order.assignedAgent ? 
              `<button class="btn btn-sm btn-primary" onclick="shopifyIntegration.assignOrder('${order.id}')">
                <i class="fas fa-user-plus"></i> Assign
              </button>` : 
              `<button class="btn btn-sm btn-secondary" onclick="shopifyIntegration.viewOrder('${order.id}')">
                <i class="fas fa-eye"></i> View
              </button>`
            }
          </div>
        </td>
      `;
    });
  }

  updateProductsTable() {
    const tableBody = document.querySelector('#shopify-products-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    this.products.forEach(product => {
      const row = tableBody.insertRow();
      const mainImage = product.images && product.images.length > 0 ? product.images[0].src : '';
      const mainVariant = product.variants && product.variants.length > 0 ? product.variants[0] : {};

      row.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${mainImage ? `<img src="${mainImage}" alt="${product.title}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : ''}
            <div>
              <strong>${product.title}</strong>
              <br><small style="color: #6c757d;">${product.vendor}</small>
            </div>
          </div>
        </td>
        <td>${mainVariant.sku || 'N/A'}</td>
        <td>${mainVariant.price ? `RM ${mainVariant.price}` : 'N/A'}</td>
        <td>${mainVariant.inventoryQuantity !== undefined ? mainVariant.inventoryQuantity : 'N/A'}</td>
        <td><span class="status-badge ${product.status === 'active' ? 'success' : 'secondary'}">${product.status}</span></td>
      `;
    });
  }

  updateStatsCards(stats) {
    // Update total orders
    const totalOrdersElement = document.querySelector('[data-stat="total-orders"]');
    if (totalOrdersElement) {
      totalOrdersElement.textContent = stats.totalOrders || 0;
    }

    // Update total revenue
    const totalRevenueElement = document.querySelector('[data-stat="total-revenue"]');
    if (totalRevenueElement) {
      totalRevenueElement.textContent = `RM${(stats.totalRevenue || 0).toFixed(2)}`;
    }

    // Update success rate
    const successRateElement = document.querySelector('[data-stat="success-rate"]');
    if (successRateElement) {
      successRateElement.textContent = `${stats.successRate || 0}%`;
    }

    // Update commissions
    const commissionsElement = document.querySelector('[data-stat="total-commissions"]');
    if (commissionsElement) {
      commissionsElement.textContent = `RM${(stats.totalCommissions || 0).toFixed(2)}`;
    }

    // Update dropdown stats
    const dropdownStats = document.querySelectorAll('.stat-number');
    if (dropdownStats.length >= 3) {
      dropdownStats[0].textContent = stats.totalOrders || 0;
      dropdownStats[1].textContent = `RM${((stats.totalRevenue || 0) / 1000).toFixed(1)}K`;
      dropdownStats[2].textContent = `${stats.successRate || 0}%`;
    }
  }

  updateOrdersStats() {
    if (this.orders.length === 0) return;

    const totalOrders = this.orders.length;
    const paidOrders = this.orders.filter(o => o.financialStatus === 'paid').length;
    const pendingOrders = this.orders.filter(o => o.financialStatus === 'pending').length;
    const totalRevenue = this.orders.reduce((sum, o) => sum + o.total, 0);

    // Update stats display if elements exist
    const statsContainer = document.querySelector('.orders-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-item">
          <span class="stat-number">${totalOrders}</span>
          <span class="stat-label">Total Orders</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${paidOrders}</span>
          <span class="stat-label">Paid Orders</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${pendingOrders}</span>
          <span class="stat-label">Pending Orders</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">RM${totalRevenue.toFixed(2)}</span>
          <span class="stat-label">Total Revenue</span>
        </div>
      `;
    }
  }

  // Helper Methods
  formatCustomerName(customer) {
    if (!customer) return 'N/A';
    if (customer.fullName) return customer.fullName;
    if (customer.firstName && customer.lastName) return `${customer.firstName} ${customer.lastName}`;
    if (customer.firstName) return customer.firstName;
    if (customer.email) return customer.email;
    return 'N/A';
  }

  formatStatus(status) {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  }

  getStatusClass(status) {
    const statusMap = {
      'paid': 'success',
      'pending': 'warning',
      'refunded': 'error',
      'partially_paid': 'warning',
      'authorized': 'info',
      'fulfilled': 'success',
      'partial': 'warning',
      'unfulfilled': 'secondary'
    };
    return statusMap[status] || 'secondary';
  }

  // Public Methods for UI Interactions
  assignOrder(orderId) {
    this.assignOrderToAgent(orderId);
  }

  viewOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      this.showOrderModal(order);
    }
  }

  refreshOrders() {
    this.fetchShopifyOrders();
  }

  syncOrders() {
    this.manualSyncOrders();
  }

  // UI Helper Methods
  showLoading(message = 'Loading...') {
    // Check if notification system exists
    if (typeof showNotification === 'function') {
      showNotification(message, 'info');
    } else {
      console.log(message);
    }
  }

  hideLoading() {
    // Can be implemented to hide loading indicators
  }

  showNotification(message, type = 'info') {
    // Use existing notification system if available
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      // Fallback to console and alert
      console.log(`${type.toUpperCase()}: ${message}`);
      if (type === 'error') {
        alert(message);
      }
    }
  }

  showOrderModal(order) {
    // Simple order details display (can be enhanced with a proper modal)
    const orderDetails = `
Order: ${order.orderNumber || order.name}
Customer: ${this.formatCustomerName(order.customer)}
Total: ${order.currency} ${order.total.toFixed(2)}
Status: ${order.financialStatus}
Items: ${order.lineItems ? order.lineItems.length : 0}
Created: ${new Date(order.createdAt).toLocaleDateString()}
    `;
    alert(orderDetails);
  }
}

// Initialize Shopify integration when page loads
let shopifyIntegration;

document.addEventListener('DOMContentLoaded', () => {
  shopifyIntegration = new ShopifyIntegration();

  // Auto-load data for different pages
  if (window.location.pathname.includes('agent-dashboard.html')) {
    // Load agent's orders and stats
    shopifyIntegration.fetchShopifyOrders({ limit: 20 });
    shopifyIntegration.getAgentStats();
  } else if (window.location.pathname.includes('admin-dashboard.html')) {
    // Load all orders for admin
    shopifyIntegration.fetchShopifyOrders({ limit: 50 });
  }
});

// Global functions for onclick handlers
window.assignOrder = (orderId) => shopifyIntegration.assignOrder(orderId);
window.viewOrder = (orderId) => shopifyIntegration.viewOrder(orderId);
window.refreshOrders = () => shopifyIntegration.refreshOrders();
window.syncOrders = () => shopifyIntegration.syncOrders();