import jwt from 'jsonwebtoken';
import { getUser } from '../services/firebase.js';

// JWT Authentication Middleware
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            } else {
                return res.status(401).json({ error: 'Token verification failed' });
            }
        }

        // Check if user still exists and is active
        const user = await getUser(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Add user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            requiresTwoFactor: decoded.requiresTwoFactor
        };

        next();

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Role-based Authorization Middleware
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Admin-only Middleware
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

// Agent-only Middleware
export const requireAgent = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['admin', 'agent'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Agent access required' });
    }

    next();
};

// Optional Authentication Middleware (for public routes that can work with or without auth)
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await getUser(decoded.userId);
                
                if (user && user.isActive) {
                    req.user = {
                        userId: decoded.userId,
                        email: decoded.email,
                        role: decoded.role,
                        requiresTwoFactor: decoded.requiresTwoFactor
                    };
                }
            } catch (error) {
                // Token is invalid, but we don't fail the request
                console.log('Optional auth failed:', error.message);
            }
        }

        next();

    } catch (error) {
        console.error('Optional auth error:', error);
        next(); // Continue without authentication
    }
};

// Rate Limiting by User ID
export const rateLimitByUser = (maxRequests, windowMs) => {
    const userRequests = new Map();

    return (req, res, next) => {
        const userId = req.user?.userId || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get user's request history
        let userHistory = userRequests.get(userId) || [];
        
        // Remove old requests outside the window
        userHistory = userHistory.filter(timestamp => timestamp > windowStart);
        
        // Check if user has exceeded the limit
        if (userHistory.length >= maxRequests) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil((userHistory[0] + windowMs - now) / 1000)
            });
        }

        // Add current request
        userHistory.push(now);
        userRequests.set(userId, userHistory);

        // Clean up old entries periodically
        if (Math.random() < 0.01) { // 1% chance to clean up
            for (const [key, history] of userRequests.entries()) {
                if (history.every(timestamp => timestamp <= windowStart)) {
                    userRequests.delete(key);
                }
            }
        }

        next();
    };
};

// Session Validation Middleware
export const validateSession = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user's session is still valid
        const user = await getUser(req.user.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check if user has been deactivated
        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Check if password was changed after token was issued
        if (user.passwordChangedAt && req.user.iat) {
            const passwordChangedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
            if (passwordChangedAt > req.user.iat) {
                return res.status(401).json({ error: 'Password was changed, please login again' });
            }
        }

        next();

    } catch (error) {
        console.error('Session validation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// CSRF Token Validation Middleware
export const validateCSRF = (req, res, next) => {
    // Skip CSRF validation for GET requests
    if (req.method === 'GET') {
        return next();
    }

    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    next();
};

// Audit Logging Middleware
export const auditLog = (action) => {
    return async (req, res, next) => {
        const startTime = Date.now();
        
        // Log the request
        console.log(`[AUDIT] ${action} - User: ${req.user?.userId || 'anonymous'} - IP: ${req.ip} - ${req.method} ${req.path}`);

        // Override res.json to log responses
        const originalJson = res.json;
        res.json = function(data) {
            const duration = Date.now() - startTime;
            console.log(`[AUDIT] ${action} - Duration: ${duration}ms - Status: ${res.statusCode}`);
            
            // Log sensitive actions
            if (['login', 'logout', 'password_change', 'settings_update'].includes(action)) {
                console.log(`[AUDIT] ${action} - User: ${req.user?.userId || 'anonymous'} - Success: ${res.statusCode < 400}`);
            }

            return originalJson.call(this, data);
        };

        next();
    };
};

export default {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireAgent,
    optionalAuth,
    rateLimitByUser,
    validateSession,
    validateCSRF,
    auditLog
};
