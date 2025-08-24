/**
 * Enterprise Products Management JavaScript
 * Handles product CRUD operations, search, filtering, and inventory management
 * Now with REAL Shopify API integration
 */

class EnterpriseProducts {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentCategory = '';
        this.apiBaseUrl = '/api';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.announceToScreenReader('Product management loaded successfully');
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        }

        // Pagination controls
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());

        // Form submission
        const addProductForm = document.getElementById('add-product-form');
        if (addProductForm) {
            addProductForm.addEventListener('submit', (e) => this.handleAddProduct(e));
        }

        // Export functionality
        const exportBtn = document.querySelector('button[onclick*="Export"]');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportProducts();
        }
    }

    async loadProducts() {
        try {
            this.showNotification('Loading products from Shopify...', 'info');
            
            // Get products from Shopify API
            const response = await fetch(`${this.apiBaseUrl}/shopify/products`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.products = data.products || data || [];
            this.filteredProducts = [...this.products];
            
            this.renderProducts();
            this.updatePagination();
            this.showNotification(`${this.products.length} products loaded from Shopify`, 'success');
            
        } catch (error) {
            console.error('Error loading products from Shopify:', error);
            this.showError(`Failed to load products from Shopify: ${error.message}`);
            
            // Show empty state instead of sample data
            this.products = [];
            this.filteredProducts = [];
            this.renderProducts();
            this.updatePagination();
        }
    }

    loadSampleProducts() {
        // Fallback sample data if Shopify API fails
        this.products = [
            {
                id: '1',
                name: 'Batik Traditional Set',
                category: 'traditional',
                price: 289.00,
                stock: 45,
                status: 'active',
                image: 'https://via.placeholder.com/300x300/8B4513/FFFFFF?text=Batik+Traditional',
                description: 'Traditional batik design with premium cotton fabric'
            },
            {
                id: '2',
                name: 'Batik Modern Design',
                category: 'modern',
                price: 156.00,
                stock: 23,
                status: 'active',
                image: 'https://via.placeholder.com/300x300/4169E1/FFFFFF?text=Batik+Modern',
                description: 'Contemporary batik patterns for modern fashion'
            },
            {
                id: '3',
                name: 'Batik Premium Collection',
                category: 'premium',
                price: 425.00,
                stock: 12,
                status: 'active',
                image: 'https://via.placeholder.com/300x300/FFD700/000000?text=Batik+Premium',
                description: 'Luxury batik with handcrafted details'
            }
        ];
        this.filteredProducts = [...this.products];
        this.renderProducts();
        this.updatePagination();
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredProducts = this.currentCategory ? 
                this.products.filter(p => p.category === this.currentCategory) : 
                [...this.products];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredProducts = this.products.filter(product => 
                (this.currentCategory === '' || product.category === this.currentCategory) &&
                (product.name.toLowerCase().includes(searchTerm) ||
                 product.description.toLowerCase().includes(searchTerm))
            );
        }
        
        this.currentPage = 1;
        this.renderProducts();
        this.updatePagination();
    }

    handleCategoryFilter(category) {
        this.currentCategory = category;
        
        if (!category) {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(product => product.category === category);
        }
        
        this.currentPage = 1;
        this.renderProducts();
        this.updatePagination();
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);

        grid.innerHTML = pageProducts.map(product => this.createProductCard(product)).join('');
        this.updatePagination();
    }

    createProductCard(product) {
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <div class="product-overlay">
                        <button class="btn btn-sm btn-primary" onclick="viewProduct('${product.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-meta">
                        <span class="product-category">${this.capitalizeFirst(product.category)}</span>
                        <span class="product-price">RM ${product.price.toFixed(2)}</span>
                    </div>
                    <div class="product-status">
                        <span class="badge ${this.getStatusClass(product.status)}">
                            ${this.getStatusIcon(product.status)} ${product.status}
                        </span>
                        <span class="stock-info ${this.getStockClass(product.stock)}">
                            <i class="fas fa-box"></i> ${product.stock} in stock
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'active': return 'badge-success';
            case 'draft': return 'badge-secondary';
            case 'archived': return 'badge-error';
            default: return 'badge-secondary';
        }
    }

    getStatusIcon(status) {
        switch (status.toLowerCase()) {
            case 'active': return '<i class="fas fa-check-circle"></i>';
            case 'draft': return '<i class="fas fa-edit"></i>';
            case 'archived': return '<i class="fas fa-archive"></i>';
            default: return '<i class="fas fa-question-circle"></i>';
        }
    }

    getStockClass(stock) {
        if (stock <= 0) return 'stock-out';
        if (stock <= 10) return 'stock-low';
        return 'stock-ok';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredProducts.length);

        // Update pagination info
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const totalProducts = document.getElementById('total-products');
        const currentPageSpan = document.getElementById('current-page');

        if (showingStart) showingStart.textContent = start;
        if (showingEnd) showingEnd.textContent = end;
        if (totalProducts) totalProducts.textContent = this.filteredProducts.length;
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
            this.renderProducts();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderProducts();
        }
    }

    async handleAddProduct(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const productData = {
            name: formData.get('name'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock')),
            description: formData.get('description'),
            status: 'draft'
        };

        try {
            this.showNotification('Adding new product to Shopify...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/shopify/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newProduct = await response.json();
            
            // Add to local array
            this.products.unshift(newProduct);
            this.filteredProducts = [...this.products];
            
            this.renderProducts();
            this.updatePagination();
            this.closeAddProductModal();
            this.showSuccess(`Product ${productData.name} added to Shopify successfully!`);
            
            // Announce to screen reader
            this.announceToScreenReader(`New product ${productData.name} added successfully`);
            
        } catch (error) {
            console.error('Error adding product to Shopify:', error);
            this.showError(`Failed to add product to Shopify: ${error.message}`);
        }
    }

    async exportProducts() {
        try {
            this.showNotification('Preparing product export...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/shopify/products/export`, {
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
            a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showSuccess('Products exported successfully!');
            
        } catch (error) {
            console.error('Error exporting products:', error);
            this.showError(`Failed to export products: ${error.message}`);
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
function openAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('product-name').focus();
    }
}

function closeAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('add-product-form').reset();
    }
}

async function viewProduct(productId) {
    try {
        const response = await fetch(`/api/shopify/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('enterprise-auth-token') || 'demo-token'}`
            }
        });
        
        if (response.ok) {
            const product = await response.json();
            alert(`Product Details:\nName: ${product.name}\nCategory: ${product.category}\nPrice: RM ${product.price}\nStock: ${product.stock}\nStatus: ${product.status}\nDescription: ${product.description}`);
        } else {
            alert('Failed to load product details');
        }
    } catch (error) {
        alert('Error loading product details');
    }
}

async function editProduct(productId) {
    // Redirect to edit page or open edit modal
    window.location.href = `enterprise-products.html?edit=${productId}`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnterpriseProducts();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnterpriseProducts;
}

