import express from 'express';
import { body, validationResult } from 'express-validator';
import { getUser, updateUser, createUser } from '../services/firebase.js';

const router = express.Router();

// Validation middleware
const validateProfileUpdate = [
    body('firstName').trim().isLength({ min: 2, max: 50 }),
    body('lastName').trim().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone(),
    body('position').optional().trim().isLength({ max: 100 }),
    body('department').optional().trim().isLength({ max: 100 })
];

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user?.userId; // From JWT middleware

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await getUser(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove sensitive data
        const { password, resetToken, resetTokenExpires, ...userData } = user;

        res.json(userData);

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', validateProfileUpdate, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const updateData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            position: req.body.position,
            department: req.body.department,
            updatedAt: new Date()
        };

        await updateUser(userId, updateData);

        res.json({ 
            message: 'Profile updated successfully',
            updatedData: updateData
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user activity
router.get('/activity', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // This would typically come from a separate activity log collection
        // For now, return mock data
        const activities = [
            {
                id: '1',
                type: 'login',
                description: 'Successfully logged in',
                timestamp: new Date(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            },
            {
                id: '2',
                type: 'profile_update',
                description: 'Updated personal information',
                timestamp: new Date(Date.now() - 86400000), // 1 day ago
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        ];

        res.json(activities);

    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user sessions
router.get('/sessions', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // This would typically come from a sessions collection
        // For now, return mock data
        const sessions = [
            {
                id: '1',
                isCurrent: true,
                device: 'Chrome on Windows',
                location: 'Kuala Lumpur, MY',
                ipAddress: req.ip,
                startedAt: new Date(Date.now() - 3600000), // 1 hour ago
                lastActivity: new Date()
            }
        ];

        res.json(sessions);

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Terminate other sessions
router.post('/sessions/terminate-others', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // This would typically invalidate other session tokens
        // For now, just return success
        res.json({ message: 'Other sessions terminated successfully' });

    } catch (error) {
        console.error('Terminate sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user preferences
router.put('/preferences', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const preferences = req.body;
        const validPreferences = {
            language: preferences.language,
            timezone: preferences.timezone,
            darkMode: preferences.darkMode,
            emailNotifications: preferences.emailNotifications,
            browserNotifications: preferences.browserNotifications,
            updatedAt: new Date()
        };

        await updateUser(userId, { preferences: validPreferences });

        res.json({ 
            message: 'Preferences updated successfully',
            preferences: validPreferences
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user preferences
router.get('/preferences', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await getUser(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const preferences = user.preferences || {
            language: 'en',
            timezone: 'Asia/Kuala_Lumpur',
            darkMode: false,
            emailNotifications: true,
            browserNotifications: true
        };

        res.json(preferences);

    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload avatar
router.post('/avatar', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // This would typically handle file upload
        // For now, return success with mock avatar URL
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.body.name || 'User')}&size=200&background=667eea&color=fff`;

        await updateUser(userId, { 
            avatarUrl,
            updatedAt: new Date()
        });

        res.json({ 
            message: 'Avatar updated successfully',
            avatarUrl
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
