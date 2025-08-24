import nodemailer from 'nodemailer';
import { getSettings } from './firebase.js';

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initializeTransporter();
    }

    async initializeTransporter() {
        try {
            const settings = await getSettings();
            const smtpConfig = settings?.notifications?.smtp;

            if (smtpConfig?.host && smtpConfig?.username && smtpConfig?.password) {
                this.transporter = nodemailer.createTransporter({
                    host: smtpConfig.host,
                    port: smtpConfig.port || 587,
                    secure: smtpConfig.port === 465,
                    auth: {
                        user: smtpConfig.username,
                        pass: smtpConfig.password
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });

                // Test connection
                await this.transporter.verify();
                this.isConfigured = true;
                console.log('Email service configured successfully');
            } else {
                console.log('Email service not configured - SMTP settings missing');
            }
        } catch (error) {
            console.error('Failed to initialize email service:', error);
            this.isConfigured = false;
        }
    }

    async sendEmail(options) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured, skipping email send');
            return false;
        }

        try {
            const mailOptions = {
                from: `"AgentOS Enterprise" <${options.from || 'noreply@agentos.com'}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            };

            if (options.attachments) {
                mailOptions.attachments = options.attachments;
            }

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return true;

        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    // Welcome email for new users
    async sendWelcomeEmail(user) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">Welcome to AgentOS Enterprise!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Your account has been successfully created</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #2d3748; margin-top: 0;">Hello ${user.firstName}!</h2>
                    
                    <p style="color: #4a5568; line-height: 1.6;">
                        Welcome to AgentOS Enterprise! Your account has been successfully created and you're now ready to start managing your business operations.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h3 style="color: #2d3748; margin-top: 0;">Account Details</h3>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
                        <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role}</p>
                        <p style="margin: 5px 0;"><strong>Department:</strong> ${user.department || 'Not specified'}</p>
                    </div>
                    
                    <p style="color: #4a5568; line-height: 1.6;">
                        You can now log in to your dashboard and start using all the features available to your role.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/login" 
                           style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                            Login to Dashboard
                        </a>
                    </div>
                    
                    <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                        If you have any questions or need assistance, please contact your system administrator.
                    </p>
                </div>
                
                <div style="background: #2d3748; padding: 20px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">© 2024 AgentOS Enterprise. All rights reserved.</p>
                </div>
            </div>
        `;

        return this.sendEmail({
            to: user.email,
            subject: 'Welcome to AgentOS Enterprise',
            html: html
        });
    }

    // Password reset email
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Reset your AgentOS Enterprise password</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #2d3748; margin-top: 0;">Hello ${user.firstName}!</h2>
                    
                    <p style="color: #4a5568; line-height: 1.6;">
                        We received a request to reset your password for your AgentOS Enterprise account. If you didn't make this request, you can safely ignore this email.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h3 style="color: #2d3748; margin-top: 0;">Reset Your Password</h3>
                        <p style="color: #4a5568; line-height: 1.6;">
                            Click the button below to reset your password. This link will expire in 1 hour for security reasons.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #718096; font-size: 14px;">
                        If the button doesn't work, you can copy and paste this link into your browser:
                    </p>
                    <p style="color: #667eea; font-size: 14px; word-break: break-all;">
                        ${resetUrl}
                    </p>
                    
                    <div style="background: #fed7d7; border: 1px solid #feb2b2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #c53030; margin: 0; font-size: 14px;">
                            <strong>Security Notice:</strong> This link will expire in 1 hour. If you need to reset your password again, please request a new reset link.
                        </p>
                    </div>
                </div>
                
                <div style="background: #2d3748; padding: 20px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">© 2024 AgentOS Enterprise. All rights reserved.</p>
                </div>
            </div>
        `;

        return this.sendEmail({
            to: user.email,
            subject: 'Reset Your AgentOS Enterprise Password',
            html: html
        });
    }

    // New order notification
    async sendNewOrderNotification(order, agent) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">New Order Assigned</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">You have a new order to process</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #2d3748; margin-top: 0;">Hello ${agent.firstName}!</h2>
                    
                    <p style="color: #4a5568; line-height: 1.6;">
                        A new order has been assigned to you. Please review the details below and take appropriate action.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h3 style="color: #2d3748; margin-top: 0;">Order Details</h3>
                        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.id}</p>
                        <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.customerName}</p>
                        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${order.currency} ${order.totalAmount}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status}</p>
                        <p style="margin: 5px 0;"><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/enterprise-orders" 
                           style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                            View Order Details
                        </a>
                    </div>
                    
                    <p style="color: #718096; font-size: 14px;">
                        Please process this order promptly to ensure customer satisfaction.
                    </p>
                </div>
                
                <div style="background: #2d3748; padding: 20px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">© 2024 AgentOS Enterprise. All rights reserved.</p>
                </div>
            </div>
        `;

        return this.sendEmail({
            to: agent.email,
            subject: `New Order Assigned - #${order.id}`,
            html: html
        });
    }

    // Low stock alert
    async sendLowStockAlert(product) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">Low Stock Alert</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Product inventory is running low</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #2d3748; margin-top: 0;">Low Stock Warning</h2>
                    
                    <p style="color: #4a5568; line-height: 1.6;">
                        The following product has reached its low stock threshold and may need to be reordered soon.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e53e3e;">
                        <h3 style="color: #2d3748; margin-top: 0;">Product Details</h3>
                        <p style="margin: 5px 0;"><strong>Product Name:</strong> ${product.name}</p>
                        <p style="margin: 5px 0;"><strong>SKU:</strong> ${product.sku}</p>
                        <p style="margin: 5px 0;"><strong>Current Stock:</strong> ${product.currentStock}</p>
                        <p style="margin: 5px 0;"><strong>Low Stock Threshold:</strong> ${product.lowStockThreshold}</p>
                        <p style="margin: 5px 0;"><strong>Category:</strong> ${product.category}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/enterprise-products" 
                           style="background: #e53e3e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                            View Product Details
                        </a>
                    </div>
                    
                    <div style="background: #fed7d7; border: 1px solid #feb2b2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #c53030; margin: 0; font-size: 14px;">
                            <strong>Action Required:</strong> Please review this product's inventory and consider placing a reorder if necessary.
                        </p>
                    </div>
                </div>
                
                <div style="background: #2d3748; padding: 20px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">© 2024 AgentOS Enterprise. All rights reserved.</p>
                </div>
            </div>
        `;

        // Send to all admins
        const admins = await this.getAdminEmails();
        const emailPromises = admins.map(email => 
            this.sendEmail({
                to: email,
                subject: `Low Stock Alert - ${product.name}`,
                html: html
            })
        );

        return Promise.all(emailPromises);
    }

    // System error notification
    async sendSystemErrorNotification(error, context) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">System Error Alert</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Critical system error detected</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #2d3748; margin-top: 0;">System Error Detected</h2>
                    
                    <p style="color: #4a5568; line-height: 1.6;">
                        A critical system error has been detected in AgentOS Enterprise. Please review the details below and take appropriate action.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e53e3e;">
                        <h3 style="color: #2d3748; margin-top: 0;">Error Details</h3>
                        <p style="margin: 5px 0;"><strong>Error Message:</strong> ${error.message}</p>
                        <p style="margin: 5px 0;"><strong>Error Type:</strong> ${error.name}</p>
                        <p style="margin: 5px 0;"><strong>Context:</strong> ${context}</p>
                        <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                        <p style="margin: 5px 0;"><strong>Stack Trace:</strong></p>
                        <pre style="background: #f7fafc; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${error.stack}</pre>
                    </div>
                    
                    <div style="background: #fed7d7; border: 1px solid #feb2b2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #c53030; margin: 0; font-size: 14px;">
                            <strong>Immediate Action Required:</strong> This error may affect system functionality. Please investigate and resolve as soon as possible.
                        </p>
                    </div>
                </div>
                
                <div style="background: #2d3748; padding: 20px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">© 2024 AgentOS Enterprise. All rights reserved.</p>
                </div>
            </div>
        `;

        // Send to all admins
        const admins = await this.getAdminEmails();
        const emailPromises = admins.map(email => 
            this.sendEmail({
                to: email,
                subject: 'Critical System Error - AgentOS Enterprise',
                html: html
            })
        );

        return Promise.all(emailPromises);
    }

    // Security event notification
    async sendSecurityEventNotification(event) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">Security Event Alert</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Security event detected</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #2d3748; margin-top: 0;">Security Event Detected</h2>
                    
                    <p style="color: #4a5568; line-height: 1.6;">
                        A security event has been detected in AgentOS Enterprise. Please review the details below and take appropriate action if necessary.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f6ad55;">
                        <h3 style="color: #2d3748; margin-top: 0;">Event Details</h3>
                        <p style="margin: 5px 0;"><strong>Event Type:</strong> ${event.type}</p>
                        <p style="margin: 5px 0;"><strong>Severity:</strong> ${event.severity}</p>
                        <p style="margin: 5px 0;"><strong>Description:</strong> ${event.description}</p>
                        <p style="margin: 5px 0;"><strong>User:</strong> ${event.userId || 'Unknown'}</p>
                        <p style="margin: 5px 0;"><strong>IP Address:</strong> ${event.ipAddress}</p>
                        <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/enterprise-settings" 
                           style="background: #f6ad55; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                            Review Security Settings
                        </a>
                    </div>
                    
                    <div style="background: #fef5e7; border: 1px solid #fbd38d; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #c05621; margin: 0; font-size: 14px;">
                            <strong>Security Notice:</strong> This event has been logged for security monitoring purposes. Review the details to determine if any action is required.
                        </p>
                    </div>
                </div>
                
                <div style="background: #2d3748; padding: 20px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">© 2024 AgentOS Enterprise. All rights reserved.</p>
                </div>
            </div>
        `;

        // Send to all admins
        const admins = await this.getAdminEmails();
        const emailPromises = admins.map(email => 
            this.sendEmail({
                to: email,
                subject: `Security Event - ${event.type}`,
                html: html
            })
        );

        return Promise.all(emailPromises);
    }

    // Get admin emails for notifications
    async getAdminEmails() {
        try {
            // This would typically come from your user management system
            // For now, return a default admin email
            return ['admin@agentos.com'];
        } catch (error) {
            console.error('Failed to get admin emails:', error);
            return ['admin@agentos.com'];
        }
    }

    // Test email configuration
    async testConfiguration() {
        if (!this.isConfigured) {
            return { success: false, error: 'Email service not configured' };
        }

        try {
            await this.transporter.verify();
            return { success: true, message: 'Email configuration is valid' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default new EmailService();
