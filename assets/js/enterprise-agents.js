/**
 * Enterprise Agents Management JavaScript
 * Handles agent CRUD operations, search, pagination, and interactions
 * Now with REAL API integration (Firebase + Shopify)
 */

class EnterpriseAgents {
    constructor() {
        this.agents = [];
        this.filteredAgents = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentSort = { column: 'name', direction: 'asc' };
        this.apiBaseUrl = process.env.NODE_ENV === 'production' ? 'https://your-firebase-project.web.app/api' : '/api';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTableSorting();
        this.loadAgents();
        this.announceToScreenReader('Agent management loaded successfully');
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('agent-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Pagination controls
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());

        // Form submission
        const addAgentForm = document.getElementById('add-agent-form');
        if (addAgentForm) {
            addAgentForm.addEventListener('submit', (e) => this.handleAddAgent(e));
        }

        // Export functionality
        const exportBtn = document.querySelector('button[onclick*="Export"]');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportAgents();
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

        // Sort agents
        this.filteredAgents.sort((a, b) => {
            const aValue = this.getAgentValue(a, columnIndex);
            const bValue = this.getAgentValue(b, columnIndex);

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

        this.renderAgents();
        this.announceToScreenReader(`Agents sorted by ${header.textContent} in ${this.currentSort.direction} order`);
    }

    getAgentValue(agent, columnIndex) {
        switch (columnIndex) {
            case 0: return agent.name || '';
            case 1: return agent.email || '';
            case 2: return agent.phone || '';
            case 3: return agent.status || '';
            case 4: return agent.totalOrders || 0;
            case 5: return agent.totalRevenue || 0;
            case 6: return agent.joinedDate || '';
            default: return '';
        }
    }

    async loadAgents() {
        try {
            this.showNotification('Loading agents...', 'info');
            
            // Try to get agents from Firebase first
            const response = await fetch(`${this.apiBaseUrl}/agents`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.agents = data.agents || data || [];
            this.filteredAgents = [...this.agents];
            
            this.renderAgents();
            this.updatePagination();
            this.showNotification(`${this.agents.length} agents loaded successfully`, 'success');
            
        } catch (error) {
            console.error('Error loading agents:', error);
            this.showError(`Failed to load agents: ${error.message}`);
            
            // Show empty state instead of sample data
            this.agents = [];
            this.filteredAgents = [];
            this.renderAgents();
            this.updatePagination();
        }
    }

    // Sample data removed - using real API only

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredAgents = [...this.agents];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredAgents = this.agents.filter(agent => 
                agent.name.toLowerCase().includes(searchTerm) ||
                agent.email.toLowerCase().includes(searchTerm) ||
                agent.phone.includes(searchTerm) ||
                agent.status.toLowerCase().includes(searchTerm)
            );
        }
        
        this.currentPage = 1;
        this.renderAgents();
        this.updatePagination();
    }

    renderAgents() {
        const tbody = document.getElementById('agents-tbody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageAgents = this.filteredAgents.slice(startIndex, endIndex);

        tbody.innerHTML = pageAgents.map(agent => this.createAgentRow(agent)).join('');
        this.updatePagination();
    }

    createAgentRow(agent) {
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: var(--space-sm);">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&size=32" 
                             style="width: 32px; height: 32px; border-radius: 50%;" alt="">
                        <div>
                            <div style="font-weight: 500;">${agent.name}</div>
                            <div style="font-size: var(--text-xs); color: var(--neutral-500);">ID: ${agent.id}</div>
                        </div>
                    </div>
                </td>
                <td>${agent.email}</td>
                <td>${agent.phone}</td>
                <td><span class="badge ${this.getStatusClass(agent.status)}">${this.getStatusIcon(agent.status)} ${agent.status}</span></td>
                <td style="font-weight: 600;">${agent.totalOrders}</td>
                <td style="font-weight: 600; color: var(--success-600);">RM ${agent.totalRevenue.toLocaleString()}</td>
                <td>${this.formatDate(agent.joinedDate)}</td>
                <td>
                    <div style="display: flex; gap: var(--space-xs);">
                        <button class="btn btn-sm btn-ghost" title="View details" onclick="viewAgent('${agent.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-ghost" title="Edit agent" onclick="editAgent('${agent.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-ghost" title="Toggle status" onclick="toggleAgentStatus('${agent.id}')">
                            <i class="fas fa-toggle-${agent.status === 'active' ? 'on' : 'off'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'active': return 'badge-success';
            case 'pending': return 'badge-warning';
            case 'inactive': return 'badge-error';
            default: return 'badge-secondary';
        }
    }

    getStatusIcon(status) {
        switch (status.toLowerCase()) {
            case 'active': return '<i class="fas fa-check-circle"></i>';
            case 'pending': return '<i class="fas fa-clock"></i>';
            case 'inactive': return '<i class="fas fa-times-circle"></i>';
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
        const totalPages = Math.ceil(this.filteredAgents.length / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredAgents.length);

        // Update pagination info
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const totalAgents = document.getElementById('total-agents');
        const currentPageSpan = document.getElementById('current-page');

        if (showingStart) showingStart.textContent = start;
        if (showingEnd) showingEnd.textContent = end;
        if (totalAgents) totalAgents.textContent = this.filteredAgents.length;
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
            this.renderAgents();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredAgents.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderAgents();
        }
    }

    async handleAddAgent(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const agentData = {
            name: this.sanitizeInput(formData.get('name')),
            email: this.sanitizeInput(formData.get('email')),
            phone: this.sanitizeInput(formData.get('phone')),
            commission: parseFloat(formData.get('commission')),
            status: 'pending'
        };

        // Validate input data
        if (!this.validateAgentData(agentData)) {
            this.showError('Please fill in all required fields correctly');
            return;
        }

        try {
            this.showNotification('Adding new agent...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/agents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agentData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newAgent = await response.json();
            
            // Add to local array
            this.agents.unshift(newAgent);
            this.filteredAgents = [...this.agents];
            
            this.renderAgents();
            this.updatePagination();
            this.closeAddAgentModal();
            this.showSuccess(`Agent ${agentData.name} added successfully!`);
            
            // Announce to screen reader
            this.announceToScreenReader(`New agent ${agentData.name} added successfully`);
            
        } catch (error) {
            console.error('Error adding agent:', error);
            this.showError(`Failed to add agent: ${error.message}`);
        }
    }

    validateAgentData(data) {
        // Validate name (alphanumeric + spaces, 2-50 chars)
        if (!data.name || !/^[a-zA-Z0-9\s]{2,50}$/.test(data.name)) {
            return false;
        }
        
        // Validate email format
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            return false;
        }
        
        // Validate phone (numbers + spaces + dashes, 10-15 chars)
        if (!data.phone || !/^[\d\s\-+()]{10,15}$/.test(data.phone)) {
            return false;
        }
        
        // Validate commission (0-100%)
        if (isNaN(data.commission) || data.commission < 0 || data.commission > 100) {
            return false;
        }
        
        return true;
    }

    sanitizeInput(input) {
        if (!input) return '';
        
        // Remove HTML tags and dangerous characters
        return input
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[<>\"'&]/g, '') // Remove dangerous characters
            .trim();
    }

    async exportAgents() {
        try {
            this.showNotification('Preparing export...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/agents/export`, {
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
            a.download = `agents-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showSuccess('Agents exported successfully!');
            
        } catch (error) {
            console.error('Error exporting agents:', error);
            this.showError(`Failed to export agents: ${error.message}`);
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
function openAddAgentModal() {
    const modal = document.getElementById('add-agent-modal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('agent-name').focus();
    }
}

function closeAddAgentModal() {
    const modal = document.getElementById('add-agent-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('add-agent-form').reset();
    }
}

async function viewAgent(agentId) {
    try {
        const response = await fetch(`/api/agents/${agentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('enterprise-auth-token') || 'demo-token'}`
            }
        });
        
        if (response.ok) {
            const agent = await response.json();
            alert(`Agent Details:\nName: ${agent.name}\nEmail: ${agent.email}\nPhone: ${agent.phone}\nStatus: ${agent.status}\nTotal Orders: ${agent.totalOrders}\nTotal Revenue: RM ${agent.totalRevenue}`);
        } else {
            alert('Failed to load agent details');
        }
    } catch (error) {
        alert('Error loading agent details');
    }
}

async function editAgent(agentId) {
    // Redirect to edit page or open edit modal
    window.location.href = `enterprise-agents.html?edit=${agentId}`;
}

async function toggleAgentStatus(agentId) {
    try {
        const response = await fetch(`/api/agents/${agentId}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('enterprise-auth-token') || 'demo-token'}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Reload agents to show updated status
            window.location.reload();
        } else {
            alert('Failed to update agent status');
        }
    } catch (error) {
        alert('Error updating agent status');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnterpriseAgents();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnterpriseAgents;
}
