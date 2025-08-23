// Admin Dashboard JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

function initializeAdmin() {
    setupFormHandlers();
    setupTableActions();
    setupExportFunctions();
    setupCommissionManagement();
    setupNotifications();
}

// Form Handlers
function setupFormHandlers() {
    // Agent Form
    const agentForm = document.getElementById('agent-form');
    if (agentForm) {
        agentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const agentData = {
                name: document.getElementById('agent-name').value,
                email: document.getElementById('agent-email').value,
                phone: document.getElementById('agent-phone').value,
                status: document.getElementById('agent-status').value
            };
            
            if (validateAgentForm(agentData)) {
                if (confirm(`Are you sure you want to add agent "${agentData.name}" with email "${agentData.email}"?`)) {
                    addAgent(agentData);
                    this.reset();
                    showNotification('Agent added successfully!', 'success');
                } else {
                    showNotification('Agent creation cancelled.', 'info');
                }
            }
        });
    }

    // Product Form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const productData = {
                name: document.getElementById('product-name').value,
                category: document.getElementById('product-category').value,
                price: document.getElementById('product-price').value,
                commission: document.getElementById('product-commission').value,
                description: document.getElementById('product-description').value,
                status: document.getElementById('product-status').value
            };
            
            if (validateProductForm(productData)) {
                if (confirm(`Are you sure you want to add product "${productData.name}" with price RM ${productData.price}?`)) {
                    addProduct(productData);
                    this.reset();
                    showNotification('Product added successfully!', 'success');
                } else {
                    showNotification('Product creation cancelled.', 'info');
                }
            }
        });
    }

    // Commission Settings Form
    const commissionForm = document.getElementById('commission-settings-form');
    if (commissionForm) {
        commissionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const commissionData = {
                defaultRate: document.getElementById('default-commission').value,
                teamLeaderBonus: document.getElementById('team-leader-bonus').value,
                performanceBonus: document.getElementById('performance-bonus').value,
                payoutFrequency: document.getElementById('payout-frequency').value
            };
            
            if (updateCommissionSettings(commissionData)) {
                showNotification('Commission settings updated successfully!', 'success');
            } else {
                showNotification('Commission settings update cancelled.', 'info');
            }
        });
    }

    // Report Form
    const reportForm = document.getElementById('report-filter-form');
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const reportData = {
                type: document.getElementById('report-type').value,
                dateFrom: document.getElementById('date-from').value,
                dateTo: document.getElementById('date-to').value,
                agent: document.getElementById('agent-filter').value
            };
            
            const reportTypeText = document.getElementById('report-type').selectedOptions[0].text;
            const dateRange = reportData.dateFrom && reportData.dateTo ? 
                ` from ${reportData.dateFrom} to ${reportData.dateTo}` : '';
            
            if (confirm(`Are you sure you want to generate ${reportTypeText}${dateRange}? This may take a few moments to process.`)) {
                generateReport(reportData);
            } else {
                showNotification('Report generation cancelled.', 'info');
            }
        });
    }

    // Security Settings Form
    const securityForm = document.getElementById('security-settings-form');
    if (securityForm) {
        securityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (updateSecuritySettings()) {
                showNotification('Security settings updated successfully!', 'success');
            } else {
                showNotification('Security settings update cancelled.', 'info');
            }
        });
    }

    // General Settings Form
    const generalForm = document.getElementById('general-settings-form');
    if (generalForm) {
        generalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (updateGeneralSettings()) {
                showNotification('General settings saved successfully!', 'success');
            } else {
                showNotification('General settings update cancelled.', 'info');
            }
        });
    }

    // Notification Settings Form
    const notificationForm = document.getElementById('notification-settings-form');
    if (notificationForm) {
        notificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (updateNotificationSettings()) {
                showNotification('Notification settings saved successfully!', 'success');
            } else {
                showNotification('Notification settings update cancelled.', 'info');
            }
        });
    }
}

// Table Actions
function setupTableActions() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.cells[0].textContent;
            editRecord(id, this);
        });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.cells[0].textContent;
            const name = row.cells[1].textContent;
            deleteRecord(id, name, row);
        });
    });

    // View buttons
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.cells[0].textContent;
            viewRecord(id);
        });
    });
}

// Export Functions
function setupExportFunctions() {
    document.querySelectorAll('.btn-export').forEach(button => {
        button.addEventListener('click', function() {
            const table = this.closest('.card').querySelector('table');
            if (table) {
                const cardHeader = this.closest('.card').querySelector('.card-header h2');
                const tableName = cardHeader ? cardHeader.textContent : 'Table';
                
                if (confirm(`Are you sure you want to export ${tableName} data to CSV? This will download a file containing the current table data.`)) {
                    exportTableToCSV(table);
                } else {
                    showNotification('Export cancelled.', 'info');
                }
            }
        });
    });
}

// Commission Management
function setupCommissionManagement() {
    // Save Commission Rule button
    const saveBtn = document.querySelector('[onclick="saveCommissionRule()"]');
    if (saveBtn) {
        saveBtn.onclick = saveCommissionRule;
    }

    // Add New Commission Rule button
    const addBtn = document.querySelector('[onclick="addNewCommissionRule()"]');
    if (addBtn) {
        addBtn.onclick = addNewCommissionRule;
    }
}

// Validation Functions
function validateAgentForm(data) {
    if (!data.name || !data.email || !data.phone) {
        showNotification('Please fill in all required fields', 'error');
        return false;
    }
    
    if (!isValidEmail(data.email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    return true;
}

function validateProductForm(data) {
    if (!data.name || !data.category || !data.price) {
        showNotification('Please fill in all required fields', 'error');
        return false;
    }
    
    if (data.price <= 0) {
        showNotification('Price must be greater than 0', 'error');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// CRUD Operations
function addAgent(agentData) {
    const agentId = 'AGT-' + String(Date.now()).slice(-3);
    const table = document.querySelector('#agents tbody') || document.querySelector('table tbody');
    
    if (table) {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${agentId}</td>
            <td>${agentData.name}</td>
            <td>${agentData.email}</td>
            <td>${agentData.phone}</td>
            <td><span class="status-badge ${agentData.status}">${agentData.status.charAt(0).toUpperCase() + agentData.status.slice(1)}</span></td>
            <td class="action-buttons">
                <button class="action-btn btn-edit" onclick="editRecord('${agentId}', this)"><i class="fas fa-edit"></i> Edit</button>
                <button class="action-btn btn-delete" onclick="deleteRecord('${agentId}', '${agentData.name}', this.closest('tr'))"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        
        // Re-setup event listeners for new row
        setupRowActions(row);
    }
}

function addProduct(productData) {
    const productId = 'PRD-' + String(Date.now()).slice(-3);
    const table = document.querySelector('#products tbody') || document.querySelector('table tbody');
    
    if (table) {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${productId}</td>
            <td>${productData.name}</td>
            <td>${productData.category}</td>
            <td>RM ${parseFloat(productData.price).toFixed(2)}</td>
            <td>${productData.commission}%</td>
            <td><span class="status-badge ${productData.status}">${productData.status.charAt(0).toUpperCase() + productData.status.slice(1)}</span></td>
            <td class="action-buttons">
                <button class="action-btn btn-edit" onclick="editRecord('${productId}', this)"><i class="fas fa-edit"></i> Edit</button>
                <button class="action-btn btn-delete" onclick="deleteRecord('${productId}', '${productData.name}', this.closest('tr'))"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        
        setupRowActions(row);
    }
}

function editRecord(id, button) {
    const row = button.closest('tr');
    const cells = row.cells;
    
    showNotification(`Editing record ${id}`, 'info');
    
    // In a real application, you would open an edit modal or form
    // For demo purposes, we'll just show an alert
    const recordType = id.startsWith('AGT-') ? 'Agent' : id.startsWith('PRD-') ? 'Product' : 'Record';
    const name = cells[1].textContent;
    
    if (confirm(`Edit ${recordType}: ${name}?`)) {
        // Here you would typically open an edit form modal
        showNotification(`${recordType} ${name} is ready for editing`, 'info');
    }
}

function deleteRecord(id, name, row) {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
        row.remove();
        showNotification(`${name} has been deleted successfully`, 'success');
    }
}

function viewRecord(id) {
    showNotification(`Viewing details for ${id}`, 'info');
    // In a real application, you would open a details modal
}

// Commission Management Functions
function saveCommissionRule() {
    const agent = document.getElementById('select-agent-commission').value;
    const product = document.getElementById('select-product-commission').value;
    const rate = document.getElementById('commission-rate').value;
    
    if (!agent || !product || !rate) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (rate < 0 || rate > 50) {
        showNotification('Commission rate must be between 0% and 50%', 'error');
        return;
    }
    
    const agentText = document.getElementById('select-agent-commission').selectedOptions[0].text;
    const productText = document.getElementById('select-product-commission').selectedOptions[0].text;
    
    if (confirm(`Are you sure you want to set ${rate}% commission for ${agentText} on ${productText}? This will affect future calculations.`)) {
        // Add to commission rules table
        const table = document.getElementById('commission-rules-table');
        if (table) {
            const currentDate = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const row = table.insertRow();
            row.innerHTML = `
                <td>${agentText}</td>
                <td>${productText}</td>
                <td>${rate}%</td>
                <td>${currentDate}</td>
                <td><span class="status-badge active">Active</span></td>
                <td class="action-buttons">
                    <button class="action-btn btn-edit"><i class="fas fa-edit"></i> Edit</button>
                    <button class="action-btn btn-delete" onclick="deleteCommissionRule(this)"><i class="fas fa-trash"></i> Delete</button>
                </td>
            `;
            
            // Clear form
            document.getElementById('select-agent-commission').value = '';
            document.getElementById('select-product-commission').value = '';
            document.getElementById('commission-rate').value = '';
            
            showNotification('Commission rule saved successfully!', 'success');
        }
    } else {
        showNotification('Commission rule creation cancelled.', 'info');
    }
}

function addNewCommissionRule() {
    // Clear the form and focus on first field
    document.getElementById('select-agent-commission').value = '';
    document.getElementById('select-product-commission').value = '';
    document.getElementById('commission-rate').value = '';
    document.getElementById('select-agent-commission').focus();
    
    showNotification('Ready to add new commission rule', 'info');
}

// Export Functions
function exportTableToCSV(table) {
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = [], cols = rows[i].querySelectorAll('td, th');
        
        for (let j = 0; j < cols.length - 1; j++) { // Exclude last column (actions)
            let cellText = cols[j].innerText;
            // Remove status badge formatting
            if (cols[j].querySelector('.status-badge')) {
                cellText = cols[j].querySelector('.status-badge').innerText;
            }
            row.push('"' + cellText.replace(/"/g, '""') + '"');
        }
        
        csv.push(row.join(','));
    }
    
    // Download CSV
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data exported to CSV successfully!', 'success');
}

// Settings Functions
function updateCommissionSettings(data) {
    if (confirm('Are you sure you want to update commission settings? This will affect all future calculations.')) {
        // Store settings in localStorage for demo purposes
        localStorage.setItem('commissionSettings', JSON.stringify(data));
        console.log('Commission settings updated:', data);
        return true;
    }
    return false;
}

function updateSecuritySettings() {
    if (confirm('Are you sure you want to update security settings? This may affect user access and login requirements.')) {
        const settings = {
            sessionTimeout: document.getElementById('session-timeout').value,
            maxLoginAttempts: document.getElementById('login-attempts').value,
            passwordPolicy: {
                minLength: document.querySelector('input[type="checkbox"]:nth-of-type(1)').checked,
                requireUppercase: document.querySelector('input[type="checkbox"]:nth-of-type(2)').checked,
                requireNumbers: document.querySelector('input[type="checkbox"]:nth-of-type(3)').checked,
                requireSpecial: document.querySelector('input[type="checkbox"]:nth-of-type(4)').checked
            }
        };
        
        localStorage.setItem('securitySettings', JSON.stringify(settings));
        console.log('Security settings updated:', settings);
        return true;
    }
    return false;
}

function updateGeneralSettings() {
    if (confirm('Are you sure you want to update general settings? This will change system-wide configurations.')) {
        const settings = {
            companyName: document.getElementById('company-name').value,
            companyEmail: document.getElementById('company-email').value,
            companyPhone: document.getElementById('company-phone').value,
            timezone: document.getElementById('timezone').value,
            currency: document.getElementById('currency').value
        };
        
        localStorage.setItem('generalSettings', JSON.stringify(settings));
        console.log('General settings updated:', settings);
        return true;
    }
    return false;
}

function updateNotificationSettings() {
    if (confirm('Are you sure you want to update notification settings? This will change how you receive system alerts.')) {
        const emailNotifications = document.querySelectorAll('input[type="checkbox"]');
        const settings = {
            notificationEmail: document.getElementById('notification-email').value,
            notifications: Array.from(emailNotifications).map(cb => ({
                type: cb.parentElement.textContent.trim(),
                enabled: cb.checked
            }))
        };
        
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
        console.log('Notification settings updated:', settings);
        return true;
    }
    return false;
}

// Report Generation
function generateReport(data) {
    showNotification('Generating report...', 'info');
    
    // Simulate report generation
    setTimeout(() => {
        const reportName = `${data.type}_report_${Date.now()}.csv`;
        showNotification(`Report ${reportName} generated successfully!`, 'success');
        
        // Add to recent reports table if it exists
        const reportsTable = document.querySelector('#recent-reports tbody');
        if (reportsTable) {
            const row = reportsTable.insertRow(0);
            const currentDate = new Date().toLocaleDateString();
            row.innerHTML = `
                <td>${reportName}</td>
                <td>${currentDate}</td>
                <td>${data.type.charAt(0).toUpperCase() + data.type.slice(1)}</td>
                <td class="action-buttons">
                    <button class="action-btn btn-export" onclick="downloadReport('${reportName}')">Download</button>
                </td>
            `;
        }
    }, 2000);
}

function downloadReport(reportName) {
    showNotification(`Downloading ${reportName}...`, 'info');
    // Simulate download
    setTimeout(() => {
        showNotification(`${reportName} downloaded successfully!`, 'success');
    }, 1000);
}

// Utility Functions
function setupRowActions(row) {
    const editBtn = row.querySelector('.btn-edit');
    const deleteBtn = row.querySelector('.btn-delete');
    const viewBtn = row.querySelector('.btn-view');
    
    if (editBtn && !editBtn.onclick) {
        editBtn.addEventListener('click', function() {
            const id = row.cells[0].textContent;
            editRecord(id, this);
        });
    }
    
    if (deleteBtn && !deleteBtn.onclick) {
        deleteBtn.addEventListener('click', function() {
            const id = row.cells[0].textContent;
            const name = row.cells[1].textContent;
            deleteRecord(id, name, row);
        });
    }
    
    if (viewBtn && !viewBtn.onclick) {
        viewBtn.addEventListener('click', function() {
            const id = row.cells[0].textContent;
            viewRecord(id);
        });
    }
}

// Notification System
function setupNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    
    const colors = {
        success: '#d4edda',
        error: '#f8d7da',
        warning: '#fff3cd',
        info: '#d1ecf1'
    };
    
    const textColors = {
        success: '#155724',
        error: '#721c24',
        warning: '#856404',
        info: '#0c5460'
    };
    
    notification.style.cssText = `
        background: ${colors[type]};
        color: ${textColors[type]};
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 8px;
        border: 1px solid ${textColors[type]}33;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateX(100%);
    `;
    
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none; 
                border: none; 
                color: inherit; 
                font-size: 18px; 
                cursor: pointer;
                margin-left: 10px;
            ">&times;</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Maintenance Functions (for settings page)
function createBackup() {
    if (confirm('Are you sure you want to create a database backup? This process may take several minutes and will create a large file.')) {
        showNotification('Creating database backup...', 'info');
        setTimeout(() => {
            showNotification('Database backup created successfully!', 'success');
        }, 3000);
    } else {
        showNotification('Database backup cancelled.', 'info');
    }
}

function runMaintenance() {
    if (confirm('Are you sure you want to run system maintenance? This may temporarily affect system performance and user access.')) {
        showNotification('Running system maintenance...', 'info');
        setTimeout(() => {
            showNotification('System maintenance completed successfully!', 'success');
        }, 5000);
    } else {
        showNotification('System maintenance cancelled.', 'info');
    }
}

function clearCache() {
    if (confirm('Are you sure you want to clear the system cache? This may temporarily slow down the system while cache is rebuilt.')) {
        showNotification('Clearing system cache...', 'info');
        setTimeout(() => {
            showNotification('System cache cleared successfully!', 'success');
        }, 2000);
    } else {
        showNotification('Cache clearing cancelled.', 'info');
    }
}

function exportSystemData() {
    if (confirm('Are you sure you want to export all system data? This will create a comprehensive backup file containing sensitive information.')) {
        showNotification('Exporting system data...', 'info');
        setTimeout(() => {
            showNotification('System data exported successfully!', 'success');
        }, 4000);
    } else {
        showNotification('System data export cancelled.', 'info');
    }
}

function checkForUpdates() {
    if (confirm('Are you sure you want to check for system updates? This will connect to external servers and may install updates automatically.')) {
        showNotification('Checking for updates...', 'info');
        setTimeout(() => {
            showNotification('System is up to date!', 'success');
        }, 3000);
    } else {
        showNotification('Update check cancelled.', 'info');
    }
}

// Additional Commission Functions
function deleteCommissionRule(button) {
    const row = button.closest('tr');
    const agent = row.cells[0].textContent;
    const product = row.cells[1].textContent;
    const rate = row.cells[2].textContent;
    
    if (confirm(`Are you sure you want to delete the commission rule for ${agent} on ${product} (${rate})? This action cannot be undone.`)) {
        row.remove();
        showNotification('Commission rule deleted successfully!', 'success');
    } else {
        showNotification('Commission rule deletion cancelled.', 'info');
    }
}

// Global functions for onclick handlers
window.saveCommissionRule = saveCommissionRule;
window.addNewCommissionRule = addNewCommissionRule;
window.deleteCommissionRule = deleteCommissionRule;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.viewRecord = viewRecord;
window.downloadReport = downloadReport;
window.createBackup = createBackup;
window.runMaintenance = runMaintenance;
window.clearCache = clearCache;
window.exportSystemData = exportSystemData;
window.checkForUpdates = checkForUpdates;