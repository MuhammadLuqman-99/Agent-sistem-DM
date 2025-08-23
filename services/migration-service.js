// Migration Service to move localStorage data to Firebase
import firebaseService from './firebase-service.js';

class MigrationService {
    constructor() {
        this.migrationCompleted = false;
    }

    // Check if migration is needed
    isMigrationNeeded() {
        return localStorage.getItem('profileInitialized') === 'true' && 
               !localStorage.getItem('firebaseMigrationCompleted');
    }

    // Migrate all localStorage data to Firebase
    async migrateAllData() {
        try {
            console.log('Starting data migration to Firebase...');
            
            // Check if user is authenticated
            if (!firebaseService.isAuthenticated()) {
                console.log('User not authenticated, creating demo accounts...');
                await this.createDemoAccounts();
            }

            // Migrate agent profile data
            if (this.hasAgentData()) {
                await this.migrateAgentProfile();
                console.log('Agent profile migrated successfully');
            }

            // Migrate admin profile data  
            if (this.hasAdminData()) {
                await this.migrateAdminProfile();
                console.log('Admin profile migrated successfully');
            }

            // Migrate sales data
            await this.migrateSalesData();

            // Migrate returns data
            await this.migrateReturnsData();

            // Mark migration as completed
            localStorage.setItem('firebaseMigrationCompleted', 'true');
            this.migrationCompleted = true;

            console.log('All data migration completed successfully!');
            return { success: true };

        } catch (error) {
            console.error('Migration failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Create demo accounts for testing
    async createDemoAccounts() {
        // Create admin account
        const adminData = {
            email: 'admin@admin-agent-teamsale.com',
            password: 'Admin123!',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            fullName: 'Admin User',
            mobilePhone: '+60123456789',
            country: 'Malaysia',
            state: 'Selangor',
            city: 'Petaling Jaya'
        };

        const adminResult = await firebaseService.registerUser(adminData);
        if (adminResult.success) {
            console.log('Demo admin account created');
        }

        // Create agent account
        const agentData = {
            email: 'agent@admin-agent-teamsale.com',
            password: 'Agent123!',
            role: 'agent',
            firstName: 'Ahmad',
            lastName: 'Rahman',
            fullName: 'Ahmad Rahman',
            gender: 'male',
            dateOfBirth: '1990-05-15',
            icNumber: '900515-08-1234',
            mobilePhone: '+60123456789',
            country: 'Malaysia',
            state: 'Selangor',
            city: 'Petaling Jaya',
            postcode: '47400',
            addressLine1: '123, Jalan SS2/24',
            addressLine2: 'SS2',
            bankName: 'Maybank',
            bankAccountNumber: '1234567890123456',
            bankAccountHolder: 'Ahmad Rahman'
        };

        const agentResult = await firebaseService.registerUser(agentData);
        if (agentResult.success) {
            console.log('Demo agent account created');
            
            // Login as agent for further operations
            await firebaseService.login(agentData.email, agentData.password);
        }
    }

    // Check if agent data exists in localStorage
    hasAgentData() {
        return localStorage.getItem('firstName') && 
               localStorage.getItem('lastName') &&
               localStorage.getItem('userRole') === 'agent';
    }

    // Check if admin data exists in localStorage
    hasAdminData() {
        return localStorage.getItem('userRole') === 'admin';
    }

    // Migrate agent profile from localStorage
    async migrateAgentProfile() {
        const profileData = {
            firstName: localStorage.getItem('firstName'),
            lastName: localStorage.getItem('lastName'),
            fullName: localStorage.getItem('fullName') || localStorage.getItem('userName'),
            gender: localStorage.getItem('gender'),
            dateOfBirth: localStorage.getItem('dateOfBirth'),
            icNumber: localStorage.getItem('icNumber'),
            mobilePhone: localStorage.getItem('mobilePhone'),
            country: localStorage.getItem('country'),
            state: localStorage.getItem('state'),
            city: localStorage.getItem('city'),
            postcode: localStorage.getItem('postcode'),
            addressLine1: localStorage.getItem('addressLine1'),
            addressLine2: localStorage.getItem('addressLine2'),
            bankName: localStorage.getItem('bankName'),
            bankAccountNumber: localStorage.getItem('bankAccountNumber'),
            bankAccountHolder: localStorage.getItem('bankAccountHolder'),
            email: localStorage.getItem('email'),
            role: 'agent'
        };

        // Remove null/undefined values
        Object.keys(profileData).forEach(key => {
            if (profileData[key] === null || profileData[key] === undefined) {
                delete profileData[key];
            }
        });

        const currentUser = firebaseService.getCurrentUser();
        if (currentUser) {
            await firebaseService.updateUserProfile(currentUser.uid, profileData);
        }
    }

    // Migrate admin profile from localStorage
    async migrateAdminProfile() {
        const profileData = {
            fullName: localStorage.getItem('userName') || 'Admin User',
            email: 'admin@desamunibatik.com',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            mobilePhone: '+60123456789',
            country: 'Malaysia',
            state: 'Selangor',
            city: 'Petaling Jaya'
        };

        const currentUser = firebaseService.getCurrentUser();
        if (currentUser) {
            await firebaseService.updateUserProfile(currentUser.uid, profileData);
        }
    }

    // Migrate sample sales data
    async migrateSalesData() {
        const sampleSales = [
            {
                invoiceNumber: 'Inv-1020IS-200825',
                hashCode: '38990hV4cb',
                orderDate: '2025-08-20',
                paymentStatus: 'paid',
                paymentMethod: 'BANK',
                paymentDate: '2025-08-20',
                shippingMethod: 'ABX EXPRESS (PENINSULAR)',
                financeReview: 'approved',
                total: 150.00,
                customerName: 'Customer A',
                customerPhone: '+60123456789',
                items: [
                    { name: 'Batik Shirt', quantity: 2, price: 75.00 }
                ]
            },
            {
                invoiceNumber: 'Inv-1019IS-190825',
                hashCode: '38989R2NC',
                orderDate: '2025-08-19',
                paymentStatus: 'paid',
                paymentMethod: 'BANK',
                paymentDate: '2025-08-19',
                shippingMethod: 'ABX EXPRESS (PENINSULAR)',
                financeReview: 'approved',
                total: 200.00,
                customerName: 'Customer B',
                customerPhone: '+60123456788',
                items: [
                    { name: 'Batik Dress', quantity: 1, price: 200.00 }
                ]
            },
            {
                invoiceNumber: 'Inv-1018IS-180825',
                hashCode: '38987Moz4b',
                orderDate: '2025-08-18',
                paymentStatus: 'deposit_paid',
                paymentMethod: 'BANK',
                paymentDate: '2025-08-18',
                shippingMethod: 'ABX EXPRESS (PENINSULAR)',
                financeReview: 'pending',
                total: 300.00,
                customerName: 'Customer C',
                customerPhone: '+60123456787',
                items: [
                    { name: 'Batik Set', quantity: 1, price: 300.00 }
                ]
            }
        ];

        for (const sale of sampleSales) {
            await firebaseService.createSaleForm(sale);
        }
    }

    // Migrate sample returns data
    async migrateReturnsData() {
        const sampleReturns = [
            {
                returnNumber: 'RET-001540',
                invoiceNumber: 'Inv-99855-120725',
                date: '2025-07-12',
                returnStatus: 'approved',
                paymentStatus: 'paid',
                total: 0.00,
                paymentMethod: 'BANK',
                shippingType: 'PICKUP',
                reason: 'CHANGE ITEM',
                customerName: 'Customer A',
                customerPhone: '+60123456789'
            },
            {
                returnNumber: 'RET-001539',
                invoiceNumber: 'Inv-99854-120725',
                date: '2025-07-12',
                returnStatus: 'processing',
                paymentStatus: 'paid',
                total: 0.00,
                paymentMethod: 'BANK',
                shippingType: 'PICKUP',
                reason: 'CHANGE ITEM',
                customerName: 'Customer B',
                customerPhone: '+60123456788'
            },
            {
                returnNumber: 'RET-001523',
                invoiceNumber: 'Inv-99185-300625',
                date: '2025-06-30',
                returnStatus: 'approved',
                paymentStatus: 'paid',
                total: 10.00,
                paymentMethod: 'BANK',
                shippingType: 'ABX EXPRESS (PENINSULAR)',
                reason: 'CHANGE ITEM',
                customerName: 'Customer C',
                customerPhone: '+60123456787'
            }
        ];

        for (const returnItem of sampleReturns) {
            await firebaseService.createReturn(returnItem);
        }
    }

    // Clear localStorage after successful migration
    clearLocalStorageData() {
        const keysToKeep = [
            'firebaseMigrationCompleted',
            'userRole',
            'userId'
        ];

        Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
    }

    // Get migration status
    getMigrationStatus() {
        return {
            completed: this.migrationCompleted || localStorage.getItem('firebaseMigrationCompleted') === 'true',
            needed: this.isMigrationNeeded()
        };
    }
}

// Create and export a single instance
const migrationService = new MigrationService();
export default migrationService;