// Sales Form List / Invoice Management functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSalesTable();
    setupSearchFunctionality();
    setupFilters();
    setupTableInteractions();
    setupPagination();
});

// Initialize the sales table with enhanced functionality
function initializeSalesTable() {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;
    
    // Add loading state initially
    showLoadingState(true);
    
    // Simulate data loading
    setTimeout(() => {
        enhanceTableRows();
        showLoadingState(false);
    }, 1000);
}

function enhanceTableRows() {
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach((row, index) => {
        // Add row numbers/IDs
        row.setAttribute('data-row-id', index + 1);
        
        // Add hover effects
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        // Add click selection
        row.addEventListener('click', function(e) {
            if (e.target.tagName !== 'BUTTON') {
                toggleRowSelection(this);
            }
        });
    });
}

function toggleRowSelection(row) {
    const isSelected = row.classList.contains('selected');
    
    // Remove selection from all rows
    document.querySelectorAll('tbody tr').forEach(r => {
        r.classList.remove('selected');
        r.style.backgroundColor = '';
    });
    
    // Add selection to clicked row if it wasn't selected
    if (!isSelected) {
        row.classList.add('selected');
        row.style.backgroundColor = '#e3f2fd';
    }
    
    updateActionButtons();
}

function updateActionButtons() {
    const selectedRows = document.querySelectorAll('tbody tr.selected');
    const bulkActions = document.querySelector('.bulk-actions');
    
    if (selectedRows.length > 0) {
        if (!bulkActions) {
            addBulkActions();
        }
    } else {
        if (bulkActions) {
            bulkActions.remove();
        }
    }
}

function addBulkActions() {
    const controls = document.querySelector('.controls');
    const bulkActionsHTML = `
        <div class="bulk-actions">
            <button class="btn btn-bulk-download">Download Selected</button>
            <button class="btn btn-bulk-export">Export Selected</button>
        </div>
    `;
    controls.insertAdjacentHTML('beforeend', bulkActionsHTML);
    
    // Setup bulk action handlers
    document.querySelector('.btn-bulk-download').addEventListener('click', handleBulkDownload);
    document.querySelector('.btn-bulk-export').addEventListener('click', handleBulkExport);
}

// Enhanced search functionality
function setupSearchFunctionality() {
    const searchInput = document.querySelector('.search-box input');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const searchTerm = this.value.toLowerCase();
        
        // Add loading state
        showLoadingState(true);
        
        searchTimeout = setTimeout(() => {
            filterTableRows(searchTerm);
            showLoadingState(false);
        }, 300);
    });
    
    // Add search suggestions
    searchInput.addEventListener('focus', showSearchSuggestions);
    searchInput.addEventListener('blur', hideSearchSuggestions);
}

function filterTableRows(searchTerm) {
    const rows = document.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm);
        
        row.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
    });
    
    updatePaginationInfo(visibleCount);
    
    // Show empty state if no results
    if (visibleCount === 0) {
        showEmptyState('No invoices found matching your search.');
    } else {
        hideEmptyState();
    }
}

function showSearchSuggestions() {
    const searchBox = document.querySelector('.search-box');
    const suggestions = ['Inv-1020IS', 'BANK', 'Paid', 'Approved', 'ABX EXPRESS'];
    
    const suggestionsList = document.createElement('div');
    suggestionsList.className = 'search-suggestions';
    suggestionsList.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0 0 8px 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 100;
        max-height: 200px;
        overflow-y: auto;
    `;
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.style.cssText = `
            padding: 12px 15px;
            cursor: pointer;
            border-bottom: 1px solid #f1f5f9;
            transition: background-color 0.2s;
        `;
        item.textContent = suggestion;
        
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f7fafc';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        item.addEventListener('click', function() {
            document.querySelector('.search-box input').value = suggestion;
            filterTableRows(suggestion.toLowerCase());
            hideSuggestions();
        });
        
        suggestionsList.appendChild(item);
    });
    
    searchBox.appendChild(suggestionsList);
}

function hideSearchSuggestions() {
    setTimeout(() => {
        const suggestions = document.querySelector('.search-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
    }, 200);
}

// Setup advanced filters
function setupFilters() {
    const filterBtn = document.querySelector('.filter-btn');
    if (!filterBtn) return;
    
    filterBtn.addEventListener('click', toggleFilterPanel);
}

function toggleFilterPanel() {
    let filterPanel = document.querySelector('.filter-panel');
    
    if (filterPanel) {
        filterPanel.remove();
        return;
    }
    
    const filterPanelHTML = `
        <div class="filter-panel">
            <div class="filter-content">
                <h4>Filter Invoices</h4>
                <div class="filter-group">
                    <label>Payment Status:</label>
                    <select id="payment-status-filter">
                        <option value="">All</option>
                        <option value="paid">Paid</option>
                        <option value="deposit-paid">Deposit Paid</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Finance Review:</label>
                    <select id="finance-review-filter">
                        <option value="">All</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Date Range:</label>
                    <div class="date-range">
                        <input type="date" id="start-date" />
                        <input type="date" id="end-date" />
                    </div>
                </div>
                <div class="filter-actions">
                    <button class="btn btn-apply-filters">Apply Filters</button>
                    <button class="btn btn-clear-filters">Clear</button>
                </div>
            </div>
        </div>
    `;
    
    // Add styles for filter panel
    const style = document.createElement('style');
    style.textContent = `
        .filter-panel {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            min-width: 300px;
            margin-top: 8px;
        }
        .filter-content {
            padding: 1.5rem;
        }
        .filter-content h4 {
            margin-bottom: 1rem;
            font-size: 1.1rem;
            font-weight: 600;
            color: #2d3748;
        }
        .filter-group {
            margin-bottom: 1rem;
        }
        .filter-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #4a5568;
        }
        .filter-group select,
        .filter-group input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
        }
        .date-range {
            display: flex;
            gap: 8px;
        }
        .filter-actions {
            display: flex;
            gap: 8px;
            margin-top: 1.5rem;
        }
        .btn-apply-filters {
            background: #3498db;
            color: white;
        }
        .btn-clear-filters {
            background: #e2e8f0;
            color: #4a5568;
        }
    `;
    document.head.appendChild(style);
    
    const controls = document.querySelector('.controls');
    controls.style.position = 'relative';
    controls.insertAdjacentHTML('beforeend', filterPanelHTML);
    
    // Setup filter handlers
    document.querySelector('.btn-apply-filters').addEventListener('click', applyFilters);
    document.querySelector('.btn-clear-filters').addEventListener('click', clearFilters);
    
    // Close panel when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function(e) {
            const panel = document.querySelector('.filter-panel');
            if (panel && !panel.contains(e.target) && !document.querySelector('.filter-btn').contains(e.target)) {
                panel.remove();
            }
        });
    }, 100);
}

// Table interaction handlers
function setupTableInteractions() {
    // View buttons
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', function() {
            const invoice = this.closest('tr').querySelector('td:first-child').textContent;
            showInvoiceDetails(invoice);
        });
    });
    
    // Download buttons
    document.querySelectorAll('.btn-download').forEach(button => {
        button.addEventListener('click', function() {
            const invoice = this.closest('tr').querySelector('td:first-child').textContent;
            downloadInvoice(invoice);
        });
    });
}

function showInvoiceDetails(invoice) {
    const modal = createModal('Invoice Details', `
        <div class="invoice-details">
            <h3>Invoice: ${invoice}</h3>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Hash Code:</label>
                    <span>38990hV4cb</span>
                </div>
                <div class="detail-item">
                    <label>Order Date:</label>
                    <span>20/08/2025</span>
                </div>
                <div class="detail-item">
                    <label>Payment Status:</label>
                    <span class="status paid">Paid</span>
                </div>
                <div class="detail-item">
                    <label>Total Amount:</label>
                    <span>RM 150.00</span>
                </div>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
}

function downloadInvoice(invoice) {
    showNotification(`Downloading invoice: ${invoice}`, 'info');
    
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${invoice}.pdf`;
    link.textContent = 'Download';
    link.style.display = 'none';
    document.body.appendChild(link);
    
    setTimeout(() => {
        showNotification(`Invoice ${invoice} downloaded successfully!`, 'success');
        document.body.removeChild(link);
    }, 2000);
}

// Utility functions
function showLoadingState(show) {
    const tableContainer = document.querySelector('.table-container');
    if (show) {
        tableContainer.style.opacity = '0.6';
        tableContainer.style.pointerEvents = 'none';
    } else {
        tableContainer.style.opacity = '1';
        tableContainer.style.pointerEvents = 'auto';
    }
}

function showEmptyState(message) {
    hideEmptyState();
    
    const emptyStateHTML = `
        <div class="empty-state">
            <i>📄</i>
            <h3>No Results Found</h3>
            <p>${message}</p>
        </div>
    `;
    
    document.querySelector('.table-container').insertAdjacentHTML('afterend', emptyStateHTML);
}

function hideEmptyState() {
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
}

function updatePaginationInfo(count) {
    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
        pageInfo.textContent = `Showing ${count} entries`;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            border-radius: 8px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <div class="modal-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #e2e8f0;
            ">
                <h3>${title}</h3>
                <button class="modal-close" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #718096;
                ">×</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    return modal;
}

// Setup pagination
function setupPagination() {
    const pageButtons = document.querySelectorAll('.page-btn');
    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            pageButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // In a real app, this would load the appropriate page
            showNotification(`Loading page ${this.textContent}...`, 'info');
        });
    });
}

// Bulk actions
function handleBulkDownload() {
    const selectedRows = document.querySelectorAll('tbody tr.selected');
    const invoices = Array.from(selectedRows).map(row => 
        row.querySelector('td:first-child').textContent
    );
    
    showNotification(`Downloading ${invoices.length} invoices...`, 'info');
    
    setTimeout(() => {
        showNotification(`Successfully downloaded ${invoices.length} invoices!`, 'success');
    }, 2000);
}

function handleBulkExport() {
    const selectedRows = document.querySelectorAll('tbody tr.selected');
    const data = Array.from(selectedRows).map(row => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).slice(0, -1).map(cell => cell.textContent.trim());
    });
    
    // Create CSV content
    const headers = ['Invoice', 'Hash Code', 'Order Date', 'Payment Status', 'Payment Method', 'Payment Date', 'Shipping Method', 'Finance Review'];
    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected-invoices.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Invoices exported successfully!', 'success');
}

function applyFilters() {
    const paymentStatus = document.getElementById('payment-status-filter').value;
    const financeReview = document.getElementById('finance-review-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    const rows = document.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        let isVisible = true;
        const cells = row.querySelectorAll('td');
        
        // Filter by payment status
        if (paymentStatus && !cells[3].textContent.toLowerCase().includes(paymentStatus)) {
            isVisible = false;
        }
        
        // Filter by finance review
        if (financeReview && !cells[7].textContent.toLowerCase().includes(financeReview)) {
            isVisible = false;
        }
        
        // Add date filtering logic here if needed
        
        row.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
    });
    
    updatePaginationInfo(visibleCount);
    document.querySelector('.filter-panel').remove();
    showNotification(`Filters applied. Showing ${visibleCount} results.`, 'success');
}

function clearFilters() {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        row.style.display = '';
    });
    
    document.getElementById('payment-status-filter').value = '';
    document.getElementById('finance-review-filter').value = '';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    
    updatePaginationInfo(rows.length);
    showNotification('Filters cleared.', 'info');
}