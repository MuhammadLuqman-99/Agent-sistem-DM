// Shopify Admin Integration for AgentOS
class ShopifyAdminIntegration {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3002';
        this.agents = [];
        this.orders = [];
        this.currentAssignOrder = null;
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    async init() {
        console.log('🚀 Initializing Shopify Admin Integration...');
        
        // Load data
        await this.loadAgents();
        await this.loadUnassignedOrders();
        await this.updatePerformanceStats();
        
        // Set up form handler
        this.setupFormHandlers();
        
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.refreshData();
        }, 5 * 60 * 1000);
        
        console.log('✅ Shopify Admin Integration ready!');
    }

    async loadAgents() {
        console.log('📋 Loading agents...');
        
        try {
            // For now, we'll use sample data since Firebase is disabled
            // In production, this would call: const response = await fetch(`${this.apiBaseUrl}/api/agents`);
            
            this.agents = [
                {
                    id: 'AGT-001',
                    name: 'Ahmad Batik',
                    email: 'ahmad@kilangbatik.com',
                    territory: 'KL-Selangor',
                    phone: '+60123456789',
                    status: 'active',
                    commissionRate: 5.0,
                    stats: {
                        totalOrders: 45,
                        totalRevenue: 6780.50,
                        totalCommission: 339.03,
                        successRate: 94.2
                    }
                },
                {
                    id: 'AGT-002',
                    name: 'Siti Maisara',
                    email: 'siti@kilangbatik.com',
                    territory: 'Johor',
                    phone: '+60198765432',
                    status: 'active',
                    commissionRate: 4.5,
                    stats: {
                        totalOrders: 38,
                        totalRevenue: 5234.75,
                        totalCommission: 235.56,
                        successRate: 89.5
                    }
                },
                {
                    id: 'AGT-003',
                    name: 'Hassan Ibrahim',
                    email: 'hassan@kilangbatik.com',
                    territory: 'Penang',
                    phone: '+60177889900',
                    status: 'active',
                    commissionRate: 5.5,
                    stats: {
                        totalOrders: 52,
                        totalRevenue: 7823.25,
                        totalCommission: 430.28,
                        successRate: 96.2
                    }
                }
            ];
            
            this.renderAgentsTable();
            this.updateAgentDropdowns();
            
        } catch (error) {
            console.error('❌ Error loading agents:', error);
            this.showError('Failed to load agents');
        }
    }

    async loadUnassignedOrders() {
        console.log('📦 Loading unassigned orders...');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/shopify/orders`);
            const result = await response.json();
            
            if (result.success) {
                // Filter unassigned orders
                this.orders = result.data.filter(order => !order.assignedAgent);
                console.log(`✅ Loaded ${this.orders.length} unassigned orders`);
                this.renderOrdersTable();
            } else {
                console.error('❌ Error loading orders:', result.error);
                this.showError('Failed to load orders from Shopify');
            }
            
        } catch (error) {
            console.error('❌ Network error loading orders:', error);
            
            // Fallback to show some sample unassigned orders
            this.orders = [
                {
                    id: '6940500000000',
                    name: '#3122',
                    customer: {
                        fullName: 'J*y (jay_decade)',
                        email: 'jay_decade.shopee@example.com'
                    },
                    shippingAddress: {
                        city: 'Sepang',
                        zip: '43800',
                        country: 'Malaysia'
                    },
                    total: 71.29,
                    currency: 'MYR',
                    financialStatus: 'paid',
                    createdAt: new Date('2025-08-23T05:59:40.000Z'),
                    assignedAgent: null
                }
            ];
            this.renderOrdersTable();
        }
    }

    renderAgentsTable() {
        const tbody = document.getElementById('agents-table-body');
        if (!tbody) return;
        
        if (this.agents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-users"></i><br>
                        No agents found. Add your first agent above.
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.agents.map(agent => `
            <tr>
                <td>${agent.id}</td>
                <td>
                    <strong>${agent.name}</strong><br>
                    <small>${agent.email}</small>
                </td>
                <td>${agent.email}</td>
                <td>
                    <span class="territory-badge">${agent.territory || 'Not Set'}</span>
                </td>
                <td>
                    <strong>${agent.stats.totalOrders}</strong><br>
                    <small>Success: ${agent.stats.successRate}%</small>
                </td>
                <td>
                    <strong>RM ${agent.stats.totalRevenue.toLocaleString('en-MY', {minimumFractionDigits: 2})}</strong><br>
                    <small>Avg: RM ${(agent.stats.totalRevenue / agent.stats.totalOrders || 0).toFixed(0)}</small>
                </td>
                <td>
                    <strong>RM ${agent.stats.totalCommission.toFixed(2)}</strong><br>
                    <small>Rate: ${agent.commissionRate}%</small>
                </td>
                <td>
                    <span class="status-badge ${agent.status}">${agent.status.toUpperCase()}</span>
                </td>
                <td class="action-buttons">
                    <button class="action-btn btn-edit" onclick="editAgent('${agent.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn btn-view" onclick="viewAgentStats('${agent.id}')">
                        <i class="fas fa-chart-bar"></i> Stats
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderOrdersTable() {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        if (this.orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-check-circle" style="color: #27ae60; font-size: 2rem;"></i><br>
                        <strong>All orders are assigned!</strong><br>
                        <small>Great job managing your orders.</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.orders.map(order => `
            <tr>
                <td>
                    <strong>${order.name}</strong><br>
                    <small>ID: ${order.id}</small>
                </td>
                <td>
                    <strong>${order.customer.fullName}</strong><br>
                    <small>${order.customer.email}</small>
                </td>
                <td>
                    <i class="fas fa-map-marker-alt"></i> ${order.shippingAddress.city}<br>
                    <small>${order.shippingAddress.zip}, ${order.shippingAddress.country}</small>
                </td>
                <td>
                    <strong>${order.currency} ${order.total.toFixed(2)}</strong>
                </td>
                <td>
                    <span class="status-badge ${order.financialStatus}">
                        ${order.financialStatus.toUpperCase()}
                    </span>
                </td>
                <td>
                    <strong>${new Date(order.createdAt).toLocaleDateString('en-MY')}</strong><br>
                    <small>${new Date(order.createdAt).toLocaleTimeString('en-MY', {hour: '2-digit', minute: '2-digit'})}</small>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="openAssignModal('${order.id}')">
                        <i class="fas fa-user-plus"></i> Assign
                    </button>
                    <button class="btn btn-success btn-sm" onclick="autoAssignOrder('${order.id}')">
                        <i class="fas fa-magic"></i> Auto
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateAgentDropdowns() {
        const dropdowns = document.querySelectorAll('#assign-agent');
        dropdowns.forEach(dropdown => {
            dropdown.innerHTML = '<option value="">Select an agent...</option>' + 
                this.agents
                    .filter(agent => agent.status === 'active')
                    .map(agent => `
                        <option value="${agent.id}">
                            ${agent.name} (${agent.territory})
                        </option>
                    `).join('');
        });
    }

    async updatePerformanceStats() {
        console.log('📊 Updating performance stats...');
        
        // Calculate stats from agents
        const totalOrders = this.agents.reduce((sum, agent) => sum + agent.stats.totalOrders, 0);
        const totalRevenue = this.agents.reduce((sum, agent) => sum + agent.stats.totalRevenue, 0);
        const totalCommission = this.agents.reduce((sum, agent) => sum + agent.stats.totalCommission, 0);
        
        // Find top performer
        const topAgent = this.agents.reduce((top, agent) => 
            agent.stats.totalRevenue > (top?.stats?.totalRevenue || 0) ? agent : top, null);
        
        // Update UI
        document.getElementById('top-agent-name').textContent = topAgent ? topAgent.name : '-';
        document.getElementById('top-agent-revenue').textContent = topAgent ? `RM ${topAgent.stats.totalRevenue.toLocaleString()}` : 'RM 0';
        document.getElementById('total-orders-count').textContent = totalOrders;
        document.getElementById('avg-order-value').textContent = `Avg: RM ${totalOrders ? (totalRevenue / totalOrders).toFixed(0) : 0}`;
        document.getElementById('total-commission').textContent = `RM ${totalCommission.toLocaleString('en-MY', {minimumFractionDigits: 2})}`;
        document.getElementById('commission-rate').textContent = `Avg Rate: ${this.agents.length ? (this.agents.reduce((sum, a) => sum + a.commissionRate, 0) / this.agents.length).toFixed(1) : 0}%`;
        document.getElementById('pending-orders').textContent = this.orders.length;
        document.getElementById('fulfillment-rate').textContent = `Fulfillment: ${totalOrders ? ((totalOrders - this.orders.length) / totalOrders * 100).toFixed(0) : 100}%`;
    }

    setupFormHandlers() {
        // Add agent form
        const form = document.getElementById('agent-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addAgent();
            });
        }
    }

    async addAgent() {
        const formData = {
            name: document.getElementById('agent-name').value,
            email: document.getElementById('agent-email').value,
            phone: document.getElementById('agent-phone').value,
            territory: document.getElementById('agent-territory').value,
            commissionRate: parseFloat(document.getElementById('agent-commission').value) || 5.0,
            status: document.getElementById('agent-status').value
        };
        
        // Validate
        if (!formData.name || !formData.email) {
            this.showError('Name and email are required');
            return;
        }
        
        try {
            // In production, this would call the API
            // const response = await fetch(`${this.apiBaseUrl}/api/agents`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
            
            // For demo, add to local array
            const newAgent = {
                id: `AGT-${(this.agents.length + 1).toString().padStart(3, '0')}`,
                ...formData,
                stats: {
                    totalOrders: 0,
                    totalRevenue: 0,
                    totalCommission: 0,
                    successRate: 0
                }
            };
            
            this.agents.push(newAgent);
            this.renderAgentsTable();
            this.updateAgentDropdowns();
            this.updatePerformanceStats();
            
            // Reset form
            document.getElementById('agent-form').reset();
            
            this.showSuccess(`Agent ${newAgent.name} added successfully!`);
            
        } catch (error) {
            console.error('❌ Error adding agent:', error);
            this.showError('Failed to add agent');
        }
    }

    showSuccess(message) {
        // Simple alert for now - in production, use a proper notification system
        alert('✅ ' + message);
    }

    showError(message) {
        console.error('❌', message);
        alert('❌ ' + message);
    }

    async refreshData() {
        console.log('🔄 Refreshing data...');
        await this.loadUnassignedOrders();
        await this.updatePerformanceStats();
    }
}

// Global functions for onclick handlers
let shopifyAdmin;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    shopifyAdmin = new ShopifyAdminIntegration();
});

// Global functions for button handlers
function refreshOrders() {
    shopifyAdmin.refreshData();
}

function openAssignModal(orderId) {
    const order = shopifyAdmin.orders.find(o => o.id === orderId);
    if (!order) return;
    
    shopifyAdmin.currentAssignOrder = order;
    
    // Update order details
    document.getElementById('order-details').innerHTML = `
        <h4>Order ${order.name}</h4>
        <p><strong>Customer:</strong> ${order.customer.fullName}</p>
        <p><strong>Location:</strong> ${order.shippingAddress.city}, ${order.shippingAddress.country}</p>
        <p><strong>Total:</strong> ${order.currency} ${order.total.toFixed(2)}</p>
        <p><strong>Status:</strong> ${order.financialStatus.toUpperCase()}</p>
    `;
    
    // Show modal
    document.getElementById('assignModal').style.display = 'block';
}

function closeAssignModal() {
    document.getElementById('assignModal').style.display = 'none';
    shopifyAdmin.currentAssignOrder = null;
}

async function confirmAssignment() {
    if (!shopifyAdmin.currentAssignOrder) return;
    
    const agentId = document.getElementById('assign-agent').value;
    const notes = document.getElementById('assign-notes').value;
    
    if (!agentId) {
        alert('Please select an agent');
        return;
    }
    
    try {
        // In production, this would call the API
        // await fetch(`${shopifyAdmin.apiBaseUrl}/api/orders/${shopifyAdmin.currentAssignOrder.id}/assign`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ agentId, notes })
        // });
        
        // For demo, remove from unassigned orders
        shopifyAdmin.orders = shopifyAdmin.orders.filter(o => o.id !== shopifyAdmin.currentAssignOrder.id);
        shopifyAdmin.renderOrdersTable();
        shopifyAdmin.updatePerformanceStats();
        
        const agent = shopifyAdmin.agents.find(a => a.id === agentId);
        shopifyAdmin.showSuccess(`Order assigned to ${agent.name} successfully!`);
        
        closeAssignModal();
        
    } catch (error) {
        console.error('❌ Error assigning order:', error);
        shopifyAdmin.showError('Failed to assign order');
    }
}

function autoAssignOrder(orderId) {
    const order = shopifyAdmin.orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Simple auto-assignment based on territory
    const city = order.shippingAddress.city.toLowerCase();
    let suggestedAgent = null;
    
    // Territory mapping
    if (city.includes('kuala lumpur') || city.includes('selangor') || city.includes('sepang')) {
        suggestedAgent = shopifyAdmin.agents.find(a => a.territory === 'KL-Selangor');
    } else if (city.includes('johor')) {
        suggestedAgent = shopifyAdmin.agents.find(a => a.territory === 'Johor');
    } else if (city.includes('penang')) {
        suggestedAgent = shopifyAdmin.agents.find(a => a.territory === 'Penang');
    }
    
    if (suggestedAgent) {
        if (confirm(`Auto-assign order ${order.name} to ${suggestedAgent.name} (${suggestedAgent.territory})?`)) {
            // Remove from unassigned orders
            shopifyAdmin.orders = shopifyAdmin.orders.filter(o => o.id !== orderId);
            shopifyAdmin.renderOrdersTable();
            shopifyAdmin.updatePerformanceStats();
            
            shopifyAdmin.showSuccess(`Order auto-assigned to ${suggestedAgent.name}!`);
        }
    } else {
        shopifyAdmin.showError('No agent found for this territory. Please assign manually.');
    }
}

function autoAssignOrders() {
    if (confirm(`Auto-assign all ${shopifyAdmin.orders.length} orders based on territory?`)) {
        let assignedCount = 0;
        
        shopifyAdmin.orders.forEach(order => {
            const city = order.shippingAddress.city.toLowerCase();
            let agent = null;
            
            if (city.includes('kuala lumpur') || city.includes('selangor') || city.includes('sepang')) {
                agent = shopifyAdmin.agents.find(a => a.territory === 'KL-Selangor');
            } else if (city.includes('johor')) {
                agent = shopifyAdmin.agents.find(a => a.territory === 'Johor');
            } else if (city.includes('penang')) {
                agent = shopifyAdmin.agents.find(a => a.territory === 'Penang');
            }
            
            if (agent) {
                assignedCount++;
            }
        });
        
        // Clear orders for demo
        shopifyAdmin.orders = shopifyAdmin.orders.filter(order => {
            const city = order.shippingAddress.city.toLowerCase();
            const hasAgent = shopifyAdmin.agents.some(agent => 
                (city.includes('kuala lumpur') || city.includes('selangor') || city.includes('sepang')) && agent.territory === 'KL-Selangor' ||
                city.includes('johor') && agent.territory === 'Johor' ||
                city.includes('penang') && agent.territory === 'Penang'
            );
            return !hasAgent; // Keep orders that couldn't be assigned
        });
        
        shopifyAdmin.renderOrdersTable();
        shopifyAdmin.updatePerformanceStats();
        
        shopifyAdmin.showSuccess(`Auto-assigned ${assignedCount} orders based on territory!`);
    }
}

function updatePerformance() {
    const period = document.getElementById('performance-period').value;
    console.log('📊 Updating performance for period:', period);
    // In production, this would filter data by the selected period
    shopifyAdmin.updatePerformanceStats();
}

function editAgent(agentId) {
    const agent = shopifyAdmin.agents.find(a => a.id === agentId);
    if (!agent) return;
    
    // For demo, just show agent info
    alert(`Edit Agent: ${agent.name}\nTerritory: ${agent.territory}\nCommission: ${agent.commissionRate}%\n\n(Edit functionality would open a modal in production)`);
}

function viewAgentStats(agentId) {
    const agent = shopifyAdmin.agents.find(a => a.id === agentId);
    if (!agent) return;
    
    alert(`Agent Statistics: ${agent.name}\n\n` +
          `Total Orders: ${agent.stats.totalOrders}\n` +
          `Total Revenue: RM ${agent.stats.totalRevenue.toLocaleString()}\n` +
          `Commission Earned: RM ${agent.stats.totalCommission.toFixed(2)}\n` +
          `Success Rate: ${agent.stats.successRate}%\n` +
          `Territory: ${agent.territory}`);
}