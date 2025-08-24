import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getUser, createUser, updateUser } from '../services/firebase.js';

const router = express.Router();

// Validation middleware
const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
];

const validatePasswordChange = [
    body('currentPassword').isLength({ min: 8 }),
    body('newPassword').isLength({ min: 8 })
];

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { email, password, remember } = req.body;

        // Get user from Firebase
        const user = await getUser(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Check if 2FA is required
        if (user.requiresTwoFactor) {
            // Generate temporary token for 2FA
            const tempToken = jwt.sign(
                { userId: user.id, email: user.email, requires2FA: true },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );

            return res.status(200).json({
                requiresTwoFactor: true,
                tempToken,
                message: 'Two-factor authentication required'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                requires2FA: false
            },
            process.env.JWT_SECRET,
            { expiresIn: remember ? '7d' : '8h' }
        );

        // Update last login
        await updateUser(user.id, { lastLogin: new Date() });

        // Remove sensitive data
        const { password: _, ...userData } = user;

        res.json({
            token,
            user: userData,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify 2FA endpoint
router.post('/verify-2fa', async (req, res) => {
    try {
        const { otp, tempToken } = req.body;

        if (!otp || !tempToken) {
            return res.status(400).json({ error: 'OTP and temporary token required' });
        }

        // Verify temp token
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired temporary token' });
        }

        // Get user
        const user = await getUser(decoded.email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify OTP (implement your 2FA logic here)
        const isValidOTP = await verifyOTP(user.id, otp);
        if (!isValidOTP) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        // Generate final JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                requires2FA: false
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Update last login
        await updateUser(user.id, { lastLogin: new Date() });

        // Remove sensitive data
        const { password: _, ...userData } = user;

        res.json({
            token,
            user: userData,
            message: 'Two-factor authentication successful'
        });

    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Get user
        const user = await getUser(decoded.email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new access token
        const newToken = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                requires2FA: false
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token: newToken,
            message: 'Token refreshed successfully'
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
    try {
        // In a real implementation, you might want to blacklist the token
        // For now, we'll just return success
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password endpoint
router.post('/change-password', validatePasswordChange, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user?.userId; // From JWT middleware

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Get user
        const user = await getUser(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await updateUser(userId, { 
            password: hashedPassword,
            passwordChangedAt: new Date()
        });

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        // Get user
        const user = await getUser(email);
        if (!user) {
            // Don't reveal if user exists or not
            return res.json({ message: 'If an account exists, a password reset email has been sent' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store reset token in user document
        await updateUser(user.id, { 
            resetToken,
            resetTokenExpires: new Date(Date.now() + 3600000) // 1 hour
        });

        // Send reset email (implement your email service here)
        // await sendPasswordResetEmail(user.email, resetToken);

        res.json({ message: 'If an account exists, a password reset email has been sent' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password required' });
        }

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired reset token' });
        }

        // Get user
        const user = await getUser(decoded.email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if reset token matches and is not expired
        if (user.resetToken !== token || new Date() > user.resetTokenExpires) {
            return res.status(401).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and clear reset token
        await updateUser(user.id, { 
            password: hashedPassword,
            passwordChangedAt: new Date(),
            resetToken: null,
            resetTokenExpires: null
        });

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to verify OTP (implement your 2FA logic)
async function verifyOTP(userId, otp) {
    // This is a placeholder - implement your actual 2FA verification logic
    // You might use TOTP, SMS, or email-based verification
    
    // For demo purposes, accept any 6-digit code
    if (otp && otp.length === 6 && /^\d{6}$/.test(otp)) {
        return true;
    }
    
    return false;
}

export default router;
