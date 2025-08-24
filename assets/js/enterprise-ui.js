/**
 * Enterprise UI Components & Interactions
 * Modern, Accessible, User-Friendly JavaScript with Enterprise Security
 */

class EnterpriseUI {
    constructor() {
        this.initializeComponents();
        this.bindEvents();
        this.loadTheme();
        this.initializeSecurity();
    }

    initializeSecurity() {
        // Enforce HTTPS in production
        if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
            this.enforceHTTPS();
        }
        
        // Initialize secure storage
        this.secureStorage = new SecureStorage();
        
        // Setup security monitoring
        this.securityMonitor = new SecurityMonitor();
        
        // Validate environment
        this.validateEnvironment();
    }

    enforceHTTPS() {
        // Redirect HTTP to HTTPS
        if (window.location.protocol === 'http:') {
            window.location.href = window.location.href.replace('http:', 'https:');
        }
        
        // Block mixed content
        this.blockMixedContent();
    }

    blockMixedContent() {
        // Monitor for mixed content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.checkMixedContent(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    checkMixedContent(element) {
        const insecureElements = element.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]');
        insecureElements.forEach(el => {
            console.warn('Mixed content detected:', el);
            // Block or warn about mixed content
            if (el.tagName === 'IMG') {
                el.style.border = '2px solid red';
                el.title = 'Insecure content blocked';
            }
        });
    }

    validateEnvironment() {
        // Check for required security features
        const requiredFeatures = [
            'localStorage',
            'sessionStorage',
            'crypto',
            'fetch'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => !window[feature]);
        
        if (missingFeatures.length > 0) {
            console.error('Missing required security features:', missingFeatures);
            this.showSecurityWarning('Your browser is missing required security features. Please update your browser.');
        }
    }

    showSecurityWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.innerHTML = `
            <div class="security-warning-content">
                <i class="fas fa-shield-alt"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 10000);
    }

    initializeComponents() {
        this.sidebar = new SidebarManager();
        this.notifications = new NotificationSystem();
        this.dashboard = new DashboardManager();
        this.forms = new FormManager();
        this.tables = new TableManager();
        this.theme = new ThemeManager();
    }

    bindEvents() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Mobile responsiveness
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Focus management
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        
        // Security events
        document.addEventListener('security-violation', this.handleSecurityViolation.bind(this));
    }

    handleSecurityViolation(event) {
        console.warn('Security violation detected:', event.detail);
        this.logSecurityEvent(event.detail);
    }

    logSecurityEvent(event) {
        // Log security events for monitoring
        if (this.securityMonitor) {
            this.securityMonitor.logEvent(event);
        }
    }

    handleKeyboardShortcuts(e) {
        // Cmd/Ctrl + K for global search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            this.dashboard.openGlobalSearch();
        }
        
        // Cmd/Ctrl + / for help
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
            e.preventDefault();
            this.showKeyboardShortcuts();
        }
        
        // Cmd/Ctrl + Shift + L for security log
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            this.showSecurityLog();
        }
    }

    showSecurityLog() {
        if (this.securityMonitor) {
            this.securityMonitor.showLog();
        }
    }

    handleResize() {
        this.sidebar.handleResize();
        this.dashboard.handleResize();
    }

    handleFocusIn(e) {
        // Add focus-visible class for keyboard navigation
        if (e.target.matches('button, input, select, textarea, a, [tabindex]')) {
            e.target.classList.add('focus-visible');
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('enterprise-theme') || 'light';
        this.theme.setTheme(savedTheme);
    }

    showKeyboardShortcuts() {
        this.notifications.show({
            type: 'info',
            title: 'Keyboard Shortcuts',
            message: `
                <div class="keyboard-shortcuts">
                    <div><kbd>Ctrl+K</kbd> Global Search</div>
                    <div><kbd>Ctrl+/</kbd> Show Shortcuts</div>
                    <div><kbd>Ctrl+Shift+L</kbd> Security Log</div>
                    <div><kbd>Esc</kbd> Close Modals</div>
                </div>
            `,
            duration: 5000
        });
    }
}

class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.app-sidebar');
        this.main = document.querySelector('.app-main');
        this.isCollapsed = false;
        this.isMobile = window.innerWidth <= 1024;
        
        this.init();
    }

    init() {
        this.createToggleButton();
        this.bindEvents();
        this.setInitialState();
    }

    createToggleButton() {
        const header = document.querySelector('.app-header-left');
        if (!header) return;

        const toggleButton = document.createElement('button');
        toggleButton.className = 'btn btn-ghost sidebar-toggle';
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        toggleButton.setAttribute('aria-label', 'Toggle sidebar');
        
        header.insertBefore(toggleButton, header.firstChild);
        
        toggleButton.addEventListener('click', () => this.toggle());
    }

    bindEvents() {
        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMobile && 
                !this.sidebar.contains(e.target) && 
                !e.target.closest('.sidebar-toggle')) {
                this.hide();
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobile) {
                this.hide();
            }
        });
    }

    toggle() {
        if (this.isMobile) {
            this.sidebar.classList.toggle('mobile-show');
        } else {
            this.isCollapsed = !this.isCollapsed;
            this.sidebar.classList.toggle('collapsed', this.isCollapsed);
            this.main.classList.toggle('sidebar-collapsed', this.isCollapsed);
        }
        
        localStorage.setItem('sidebar-collapsed', this.isCollapsed);
    }

    hide() {
        this.sidebar.classList.remove('mobile-show');
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 1024;
        
        if (wasMobile !== this.isMobile) {
            this.setInitialState();
        }
    }

    setInitialState() {
        if (this.isMobile) {
            this.sidebar.classList.add('mobile-hidden');
            this.main.classList.add('sidebar-hidden');
        } else {
            this.sidebar.classList.remove('mobile-hidden', 'mobile-show');
            this.main.classList.remove('sidebar-hidden');
            
            const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            if (collapsed) {
                this.isCollapsed = true;
                this.sidebar.classList.add('collapsed');
                this.main.classList.add('sidebar-collapsed');
            }
        }
    }
}

class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    }

    show({ type = 'info', title, message, duration = 4000, actions = [] }) {
        const notification = this.createNotification({ type, title, message, actions });
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(notification), duration);
        }

        return notification;
    }

    createNotification({ type, title, message, actions }) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: var(--neutral-0);
            border: 1px solid var(--neutral-200);
            border-radius: var(--radius-xl);
            padding: var(--space-lg);
            margin-bottom: var(--space-md);
            box-shadow: var(--shadow-lg);
            transform: translateX(100%);
            opacity: 0;
            transition: all var(--transition-normal);
            pointer-events: all;
            max-width: 100%;
        `;

        const typeIcons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const typeColors = {
            success: 'var(--success-500)',
            error: 'var(--error-500)',
            warning: 'var(--warning-500)',
            info: 'var(--primary-500)'
        };

        notification.innerHTML = `
            <div style="display: flex; gap: var(--space-md);">
                <div style="color: ${typeColors[type]}; font-size: var(--text-lg);">
                    <i class="${typeIcons[type]}"></i>
                </div>
                <div style="flex: 1;">
                    ${title ? `<div style="font-weight: 600; color: var(--neutral-800); margin-bottom: var(--space-xs);">${title}</div>` : ''}
                    <div style="color: var(--neutral-600); font-size: var(--text-sm);">${message}</div>
                    ${actions.length ? this.createActions(actions) : ''}
                </div>
                <button class="notification-close" style="
                    background: none;
                    border: none;
                    color: var(--neutral-400);
                    cursor: pointer;
                    padding: var(--space-xs);
                    border-radius: var(--radius-md);
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Bind close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.dismiss(notification);
        });

        return notification;
    }

    createActions(actions) {
        return `
            <div style="margin-top: var(--space-md); display: flex; gap: var(--space-sm);">
                ${actions.map(action => `
                    <button class="btn btn-sm ${action.primary ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="${action.onClick}">
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        `;
    }

    dismiss(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    success(title, message) {
        return this.show({ type: 'success', title, message });
    }

    error(title, message) {
        return this.show({ type: 'error', title, message, duration: 0 });
    }

    warning(title, message) {
        return this.show({ type: 'warning', title, message });
    }

    info(title, message) {
        return this.show({ type: 'info', title, message });
    }
}

class DashboardManager {
    constructor() {
        this.charts = new Map();
        this.realTimeData = new Map();
        this.init();
    }

    init() {
        this.initializeCharts();
        this.startRealTimeUpdates();
        this.createGlobalSearch();
    }

    initializeCharts() {
        // Initialize Chart.js or other charting library
        this.loadChartLibrary().then(() => {
            this.createSalesChart();
            this.createPerformanceChart();
            this.createCommissionChart();
        });
    }

    async loadChartLibrary() {
        if (window.Chart) return;
        
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    createSalesChart() {
        const canvas = document.getElementById('sales-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Sales',
                    data: [12000, 19000, 3000, 5000, 2000, 3000],
                    borderColor: 'rgb(14, 165, 233)',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'RM' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('sales', chart);
    }

    createGlobalSearch() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'global-search-container';
        searchContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: none;
            align-items: flex-start;
            justify-content: center;
            padding-top: 10vh;
        `;

        searchContainer.innerHTML = `
            <div class="global-search-modal" style="
                background: var(--neutral-0);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-xl);
                width: 90%;
                max-width: 600px;
                overflow: hidden;
            ">
                <div style="padding: var(--space-2xl); border-bottom: 1px solid var(--neutral-200);">
                    <input type="text" 
                           class="form-control global-search-input" 
                           placeholder="Search anything..."
                           style="border: none; box-shadow: none; font-size: var(--text-lg);">
                </div>
                <div class="global-search-results" style="max-height: 400px; overflow-y: auto;">
                    <div style="padding: var(--space-2xl); text-align: center; color: var(--neutral-500);">
                        Type to search...
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(searchContainer);
        this.globalSearchContainer = searchContainer;
        this.globalSearchInput = searchContainer.querySelector('.global-search-input');
        this.globalSearchResults = searchContainer.querySelector('.global-search-results');

        // Bind events
        searchContainer.addEventListener('click', (e) => {
            if (e.target === searchContainer) {
                this.closeGlobalSearch();
            }
        });

        this.globalSearchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
    }

    openGlobalSearch() {
        this.globalSearchContainer.style.display = 'flex';
        this.globalSearchInput.focus();
    }

    closeGlobalSearch() {
        this.globalSearchContainer.style.display = 'none';
        this.globalSearchInput.value = '';
    }

    performSearch(query) {
        if (!query.trim()) {
            this.globalSearchResults.innerHTML = `
                <div style="padding: var(--space-2xl); text-align: center; color: var(--neutral-500);">
                    Type to search...
                </div>
            `;
            return;
        }

        // Mock search results
        const results = [
            { type: 'Agent', title: 'John Doe', subtitle: 'Sales Agent - Territory: KL' },
            { type: 'Order', title: 'Order #12345', subtitle: 'RM 1,200 - Pending' },
            { type: 'Product', title: 'Batik Traditional', subtitle: 'In Stock - RM 89' }
        ];

        this.globalSearchResults.innerHTML = results.map(result => `
            <div class="search-result-item" style="
                padding: var(--space-lg) var(--space-2xl);
                border-bottom: 1px solid var(--neutral-200);
                cursor: pointer;
                transition: background var(--transition-fast);
            " onmouseover="this.style.background='var(--neutral-50)'" 
               onmouseout="this.style.background='transparent'">
                <div style="font-weight: 500; color: var(--neutral-800);">${result.title}</div>
                <div style="font-size: var(--text-sm); color: var(--neutral-500);">${result.subtitle}</div>
                <div style="font-size: var(--text-xs); color: var(--primary-500); margin-top: var(--space-xs);">
                    ${result.type}
                </div>
            </div>
        `).join('');
    }

    startRealTimeUpdates() {
        setInterval(() => {
            this.updateRealTimeStats();
        }, 30000); // Update every 30 seconds
    }

    updateRealTimeStats() {
        // Update stats with real-time data
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            const value = card.querySelector('.stat-value');
            if (value) {
                // Simulate real-time updates
                this.animateNumberChange(value);
            }
        });
    }

    animateNumberChange(element) {
        element.style.transform = 'scale(1.05)';
        element.style.color = 'var(--primary-600)';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.color = 'var(--neutral-800)';
        }, 200);
    }

    handleResize() {
        // Redraw charts on resize
        this.charts.forEach(chart => {
            chart.resize();
        });
    }
}

class FormManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindFormEvents();
        this.addFormValidation();
        this.addAutoSave();
    }

    bindFormEvents() {
        document.addEventListener('submit', this.handleFormSubmit.bind(this));
        document.addEventListener('input', this.handleFormInput.bind(this));
    }

    handleFormSubmit(e) {
        const form = e.target.closest('form');
        if (!form) return;

        if (!this.validateForm(form)) {
            e.preventDefault();
            return false;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            const originalText = submitButton.textContent;
            submitButton.innerHTML = '<i class="spinner"></i> Saving...';
            submitButton.disabled = true;
            
            // Reset after 2 seconds (replace with actual API call)
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 2000);
        }
    }

    handleFormInput(e) {
        if (e.target.matches('.form-control')) {
            this.clearFieldError(e.target);
        }
    }

    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('.form-control[required]');
        
        fields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.style.borderColor = 'var(--error-500)';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.style.borderColor = 'var(--neutral-300)';
        
        const errorDiv = field.parentNode.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    addAutoSave() {
        const forms = document.querySelectorAll('form[data-autosave]');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                input.addEventListener('input', debounce(() => {
                    this.saveFormData(form);
                }, 1000));
            });
        });
    }

    saveFormData(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        localStorage.setItem(`form-${form.id}`, JSON.stringify(data));
        
        // Show auto-save indicator
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.innerHTML = '<i class="fas fa-check"></i> Auto-saved';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--success-500);
            color: white;
            padding: var(--space-sm) var(--space-lg);
            border-radius: var(--radius-full);
            font-size: var(--text-sm);
            z-index: 1000;
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 2000);
    }
}

class TableManager {
    constructor() {
        this.init();
    }

    init() {
        this.addTableFeatures();
        this.addSortingFunctionality();
        this.addFilterFunctionality();
    }

    addTableFeatures() {
        const tables = document.querySelectorAll('.table');
        
        tables.forEach(table => {
            this.makeTableResponsive(table);
            this.addRowActions(table);
        });
    }

    makeTableResponsive(table) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        wrapper.style.cssText = `
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        `;
        
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    }

    addSortingFunctionality() {
        const sortableHeaders = document.querySelectorAll('th[data-sortable]');
        
        sortableHeaders.forEach(header => {
            header.style.cursor = 'pointer';
            header.innerHTML += ' <i class="fas fa-sort sort-icon"></i>';
            
            header.addEventListener('click', () => {
                this.sortTable(header);
            });
        });
    }

    sortTable(header) {
        const table = header.closest('table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const columnIndex = Array.from(header.parentNode.children).indexOf(header);
        
        const isNumeric = header.dataset.type === 'number';
        const currentOrder = header.dataset.order || 'asc';
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        
        rows.sort((a, b) => {
            const aValue = a.cells[columnIndex].textContent.trim();
            const bValue = b.cells[columnIndex].textContent.trim();
            
            let comparison = 0;
            if (isNumeric) {
                comparison = parseFloat(aValue) - parseFloat(bValue);
            } else {
                comparison = aValue.localeCompare(bValue);
            }
            
            return newOrder === 'desc' ? -comparison : comparison;
        });
        
        // Update table
        rows.forEach(row => tbody.appendChild(row));
        
        // Update header
        header.dataset.order = newOrder;
        const icon = header.querySelector('.sort-icon');
        icon.className = `fas fa-sort-${newOrder === 'asc' ? 'up' : 'down'} sort-icon`;
    }
}

class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'auto'];
        this.currentTheme = 'light';
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('enterprise-theme', theme);
        
        // Update theme toggle buttons
        const themeToggles = document.querySelectorAll('.theme-toggle');
        themeToggles.forEach(toggle => {
            toggle.textContent = theme === 'light' ? '🌙' : '☀️';
        });
    }

    toggleTheme() {
        const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(nextTheme);
    }
}

// Secure Storage Class
class SecureStorage {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
    }

    generateEncryptionKey() {
        // Generate a secure encryption key
        const array = new Uint8Array(32);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(array);
        }
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    encrypt(data) {
        // Simple encryption for sensitive data
        if (typeof data === 'string') {
            return btoa(encodeURIComponent(data));
        }
        return btoa(JSON.stringify(data));
    }

    decrypt(encryptedData) {
        try {
            const decrypted = decodeURIComponent(atob(encryptedData));
            try {
                return JSON.parse(decrypted);
            } catch {
                return decrypted;
            }
        } catch {
            return null;
        }
    }

    setSecureItem(key, value) {
        const encrypted = this.encrypt(value);
        sessionStorage.setItem(key, encrypted);
    }

    getSecureItem(key) {
        const encrypted = sessionStorage.getItem(key);
        if (!encrypted) return null;
        return this.decrypt(encrypted);
    }

    removeSecureItem(key) {
        sessionStorage.removeItem(key);
    }

    clearSecureStorage() {
        sessionStorage.clear();
    }
}

// Security Monitor Class
class SecurityMonitor {
    constructor() {
        this.securityEvents = [];
        this.maxEvents = 1000;
        this.initializeMonitoring();
    }

    initializeMonitoring() {
        // Monitor for suspicious activities
        this.monitorXSS();
        this.monitorInjection();
        this.monitorNavigation();
    }

    monitorXSS() {
        // Monitor for potential XSS attempts
        const originalInnerHTML = Element.prototype.innerHTML;
        Element.prototype.innerHTML = function(value) {
            if (typeof value === 'string' && this.containsScript(value)) {
                this.logSecurityEvent({
                    type: 'XSS_ATTEMPT',
                    target: this.tagName,
                    value: value,
                    timestamp: new Date().toISOString()
                });
                throw new Error('Potential XSS attack detected');
            }
            return originalInnerHTML.call(this, value);
        };
    }

    containsScript(value) {
        return /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value);
    }

    monitorInjection() {
        // Monitor for SQL injection patterns
        const injectionPatterns = [
            /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
            /(--|\/\*|\*\/|;)/,
            /(\b(or|and)\b\s+\d+\s*[=<>])/i
        ];
        
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                const value = e.target.value;
                injectionPatterns.forEach(pattern => {
                    if (pattern.test(value)) {
                        this.logSecurityEvent({
                            type: 'INJECTION_ATTEMPT',
                            target: e.target.name || e.target.id,
                            value: value,
                            pattern: pattern.source,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
        });
    }

    monitorNavigation() {
        // Monitor for suspicious navigation
        let navigationCount = 0;
        const navigationThreshold = 10;
        const timeWindow = 60000; // 1 minute
        
        setInterval(() => {
            navigationCount = 0;
        }, timeWindow);
        
        window.addEventListener('beforeunload', () => {
            navigationCount++;
            if (navigationCount > navigationThreshold) {
                this.logSecurityEvent({
                    type: 'EXCESSIVE_NAVIGATION',
                    count: navigationCount,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    logEvent(event) {
        this.securityEvents.push(event);
        
        // Keep only recent events
        if (this.securityEvents.length > this.maxEvents) {
            this.securityEvents = this.securityEvents.slice(-this.maxEvents);
        }
        
        // Send to server if critical
        if (event.type.includes('ATTEMPT') || event.type.includes('ATTACK')) {
            this.reportToServer(event);
        }
    }

    reportToServer(event) {
        // Report security events to server
        fetch('/api/security/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('enterprise-auth-token')}`
            },
            body: JSON.stringify(event)
        }).catch(error => {
            console.error('Failed to report security event:', error);
        });
    }

    showLog() {
        // Display security log
        const logWindow = window.open('', 'Security Log', 'width=800,height=600');
        logWindow.document.write(`
            <html>
                <head>
                    <title>Security Log</title>
                    <style>
                        body { font-family: monospace; padding: 20px; }
                        .event { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
                        .critical { background: #ffebee; border-color: #f44336; }
                    </style>
                </head>
                <body>
                    <h1>Security Log</h1>
                    <p>Total Events: ${this.securityEvents.length}</p>
                    ${this.securityEvents.map(event => `
                        <div class="event ${event.type.includes('ATTEMPT') || event.type.includes('ATTACK') ? 'critical' : ''}">
                            <strong>${event.type}</strong> - ${event.timestamp}
                            <br>${JSON.stringify(event, null, 2)}
                        </div>
                    `).join('')}
                </body>
            </html>
        `);
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Initialize Enterprise UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enterpriseUI = new EnterpriseUI();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnterpriseUI, SidebarManager, NotificationSystem, DashboardManager };
}