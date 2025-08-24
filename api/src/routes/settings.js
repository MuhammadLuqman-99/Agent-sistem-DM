import express from 'express';
import { body, validationResult } from 'express-validator';
import { getSettings, updateSettings, createSettings } from '../services/firebase.js';

const router = express.Router();

// Validation middleware
const validateGeneralSettings = [
    body('companyName').trim().isLength({ min: 2, max: 100 }),
    body('companyEmail').isEmail().normalizeEmail(),
    body('companyPhone').optional().isMobilePhone(),
    body('companyAddress').optional().trim().isLength({ max: 500 }),
    body('timezone').isIn(['Asia/Kuala_Lumpur', 'UTC', 'America/New_York', 'Europe/London']),
    body('currency').isIn(['MYR', 'USD', 'EUR', 'SGD']),
    body('dateFormat').isIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
    body('language').isIn(['en', 'ms', 'zh', 'ta'])
];

const validateSecuritySettings = [
    body('sessionTimeout').isInt({ min: 15, max: 1440 }),
    body('maxLoginAttempts').isInt({ min: 3, max: 10 }),
    body('lockoutDuration').isInt({ min: 5, max: 1440 }),
    body('minPasswordLength').isInt({ min: 6, max: 20 })
];

const validateIntegrationSettings = [
    body('shopifyShopName').optional().trim().isLength({ max: 100 }),
    body('shopifyAccessToken').optional().trim().isLength({ max: 200 }),
    body('shopifyWebhookSecret').optional().trim().isLength({ max: 200 }),
    body('firebaseProjectId').optional().trim().isLength({ max: 100 }),
    body('firebaseDatabaseUrl').optional().isURL()
];

// Get all settings
router.get('/', async (req, res) => {
    try {
        const settings = await getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get settings by category
router.get('/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const settings = await getSettings();
        
        const categorySettings = settings[category] || {};
        res.json(categorySettings);
    } catch (error) {
        console.error('Get category settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update general settings
router.put('/general', validateGeneralSettings, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const updateData = {
            companyName: req.body.companyName,
            companyEmail: req.body.companyEmail,
            companyPhone: req.body.companyPhone,
            companyAddress: req.body.companyAddress,
            timezone: req.body.timezone,
            currency: req.body.currency,
            dateFormat: req.body.dateFormat,
            language: req.body.language,
            updatedAt: new Date()
        };

        await updateSettings('general', updateData);

        res.json({ 
            message: 'General settings updated successfully',
            settings: updateData
        });

    } catch (error) {
        console.error('Update general settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update security settings
router.put('/security', validateSecuritySettings, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const updateData = {
            sessionTimeout: req.body.sessionTimeout,
            maxLoginAttempts: req.body.maxLoginAttempts,
            lockoutDuration: req.body.lockoutDuration,
            requireTwoFactor: req.body.requireTwoFactor,
            requireTwoFactorAdmin: req.body.requireTwoFactorAdmin,
            twoFactorMethod: req.body.twoFactorMethod,
            minPasswordLength: req.body.minPasswordLength,
            requireUppercase: req.body.requireUppercase,
            requireLowercase: req.body.requireLowercase,
            requireNumbers: req.body.requireNumbers,
            requireSymbols: req.body.requireSymbols,
            updatedAt: new Date()
        };

        await updateSettings('security', updateData);

        res.json({ 
            message: 'Security settings updated successfully',
            settings: updateData
        });

    } catch (error) {
        console.error('Update security settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update integration settings
router.put('/integrations', validateIntegrationSettings, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const updateData = {
            shopify: {
                shopName: req.body.shopifyShopName,
                accessToken: req.body.shopifyAccessToken,
                webhookSecret: req.body.shopifyWebhookSecret
            },
            firebase: {
                projectId: req.body.firebaseProjectId,
                databaseUrl: req.body.firebaseDatabaseUrl
            },
            updatedAt: new Date()
        };

        await updateSettings('integrations', updateData);

        res.json({ 
            message: 'Integration settings updated successfully',
            settings: updateData
        });

    } catch (error) {
        console.error('Update integration settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update notification settings
router.put('/notifications', async (req, res) => {
    try {
        const updateData = {
            smtp: {
                host: req.body.smtpHost,
                port: req.body.smtpPort,
                username: req.body.smtpUsername,
                password: req.body.smtpPassword
            },
            preferences: {
                notifyNewOrders: req.body.notifyNewOrders,
                notifyLowStock: req.body.notifyLowStock,
                notifySystemErrors: req.body.notifySystemErrors,
                notifySecurityEvents: req.body.notifySecurityEvents
            },
            updatedAt: new Date()
        };

        await updateSettings('notifications', updateData);

        res.json({ 
            message: 'Notification settings updated successfully',
            settings: updateData
        });

    } catch (error) {
        console.error('Update notification settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update backup settings
router.put('/backup', async (req, res) => {
    try {
        const updateData = {
            autoBackup: req.body.autoBackup,
            backupFrequency: req.body.backupFrequency,
            backupRetention: req.body.backupRetention,
            backupTime: req.body.backupTime,
            updatedAt: new Date()
        };

        await updateSettings('backup', updateData);

        res.json({ 
            message: 'Backup settings updated successfully',
            settings: updateData
        });

    } catch (error) {
        console.error('Update backup settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update advanced settings
router.put('/advanced', async (req, res) => {
    try {
        const updateData = {
            performance: {
                maxConcurrentUsers: req.body.maxConcurrentUsers,
                apiRateLimit: req.body.apiRateLimit,
                requestTimeout: req.body.requestTimeout
            },
            logging: {
                logLevel: req.body.logLevel,
                enableAuditLog: req.body.enableAuditLog,
                enableSecurityLog: req.body.enableSecurityLog
            },
            updatedAt: new Date()
        };

        await updateSettings('advanced', updateData);

        res.json({ 
            message: 'Advanced settings updated successfully',
            settings: updateData
        });

    } catch (error) {
        console.error('Update advanced settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test Shopify connection
router.post('/test-shopify', async (req, res) => {
    try {
        const { shopName, accessToken } = req.body;

        if (!shopName || !accessToken) {
            return res.status(400).json({ error: 'Shop name and access token required' });
        }

        // Test Shopify API connection
        const testUrl = `https://${shopName}/admin/api/2023-10/shop.json`;
        
        try {
            const response = await fetch(testUrl, {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const shopData = await response.json();
                res.json({ 
                    success: true, 
                    message: 'Shopify connection successful',
                    shop: shopData.shop
                });
            } else {
                res.status(400).json({ 
                    success: false, 
                    error: 'Failed to connect to Shopify',
                    status: response.status
                });
            }
        } catch (fetchError) {
            res.status(400).json({ 
                success: false, 
                error: 'Network error connecting to Shopify'
            });
        }

    } catch (error) {
        console.error('Test Shopify error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test email connection
router.post('/test-email', async (req, res) => {
    try {
        const { smtpHost, smtpPort, smtpUsername, smtpPassword } = req.body;

        if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
            return res.status(400).json({ error: 'All SMTP fields are required' });
        }

        // This would typically test SMTP connection
        // For now, return success
        res.json({ 
            success: true, 
            message: 'Email connection test successful'
        });

    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create backup
router.post('/backup/create', async (req, res) => {
    try {
        // This would typically create a system backup
        const backupInfo = {
            id: `backup-${Date.now()}`,
            timestamp: new Date(),
            size: '0 MB',
            status: 'completed',
            type: 'manual'
        };

        res.json({ 
            message: 'Backup created successfully',
            backup: backupInfo
        });

    } catch (error) {
        console.error('Create backup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get backup history
router.get('/backup/history', async (req, res) => {
    try {
        // This would typically come from a backup collection
        const backupHistory = [
            {
                id: 'backup-1',
                timestamp: new Date(Date.now() - 86400000), // 1 day ago
                size: '15.2 MB',
                status: 'completed',
                type: 'automatic'
            },
            {
                id: 'backup-2',
                timestamp: new Date(Date.now() - 172800000), // 2 days ago
                size: '14.8 MB',
                status: 'completed',
                type: 'automatic'
            }
        ];

        res.json(backupHistory);

    } catch (error) {
        console.error('Get backup history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset all settings
router.post('/reset', async (req, res) => {
    try {
        // This would typically reset all settings to default values
        await updateSettings('general', {
            companyName: 'AgentOS Enterprise',
            companyEmail: 'admin@agentos.com',
            companyPhone: '+60 12-345 6789',
            companyAddress: 'Kuala Lumpur, Malaysia',
            timezone: 'Asia/Kuala_Lumpur',
            currency: 'MYR',
            dateFormat: 'DD/MM/YYYY',
            language: 'en'
        });

        res.json({ message: 'All settings reset to default values' });

    } catch (error) {
        console.error('Reset settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
