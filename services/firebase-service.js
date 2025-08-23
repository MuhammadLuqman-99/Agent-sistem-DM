// Firebase Service for Agent and Admin Data Management
import { auth, db, storage } from '../config/firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy 
} from 'firebase/firestore';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'firebase/storage';

class FirebaseService {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        
        // Listen to auth state changes
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            if (user) {
                this.loadUserRole();
            }
        });
    }

    // Authentication Methods
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Load user profile to determine role
            const userDoc = await this.getUserProfile(user.uid);
            if (userDoc) {
                this.userRole = userDoc.role;
                localStorage.setItem('userRole', userDoc.role);
                localStorage.setItem('userId', user.uid);
                return { success: true, user: userDoc };
            }
            
            throw new Error('User profile not found');
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await signOut(auth);
            localStorage.clear();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    async registerUser(userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                userData.email, 
                userData.password
            );
            const user = userCredential.user;

            // Create user profile in Firestore
            await this.createUserProfile(user.uid, {
                ...userData,
                createdAt: new Date(),
                lastLogin: new Date()
            });

            return { success: true, user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // User Profile Methods
    async createUserProfile(userId, profileData) {
        try {
            await setDoc(doc(db, 'users', userId), profileData);
            return { success: true };
        } catch (error) {
            console.error('Create profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(userId) {
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Get profile error:', error);
            return null;
        }
    }

    async updateUserProfile(userId, updateData) {
        try {
            const docRef = doc(db, 'users', userId);
            await updateDoc(docRef, {
                ...updateData,
                updatedAt: new Date()
            });
            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async loadUserRole() {
        if (this.currentUser) {
            const profile = await this.getUserProfile(this.currentUser.uid);
            if (profile) {
                this.userRole = profile.role;
            }
        }
    }

    // Agent Data Methods
    async createSaleForm(saleData) {
        try {
            const docRef = doc(collection(db, 'sales'));
            await setDoc(docRef, {
                ...saleData,
                agentId: this.currentUser.uid,
                createdAt: new Date(),
                status: 'pending'
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Create sale form error:', error);
            return { success: false, error: error.message };
        }
    }

    async getAgentSales(agentId) {
        try {
            const q = query(
                collection(db, 'sales'),
                where('agentId', '==', agentId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const sales = [];
            
            querySnapshot.forEach((doc) => {
                sales.push({ id: doc.id, ...doc.data() });
            });
            
            return sales;
        } catch (error) {
            console.error('Get agent sales error:', error);
            return [];
        }
    }

    async createReturn(returnData) {
        try {
            const docRef = doc(collection(db, 'returns'));
            await setDoc(docRef, {
                ...returnData,
                agentId: this.currentUser.uid,
                createdAt: new Date(),
                status: 'processing'
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Create return error:', error);
            return { success: false, error: error.message };
        }
    }

    async getAgentReturns(agentId) {
        try {
            const q = query(
                collection(db, 'returns'),
                where('agentId', '==', agentId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const returns = [];
            
            querySnapshot.forEach((doc) => {
                returns.push({ id: doc.id, ...doc.data() });
            });
            
            return returns;
        } catch (error) {
            console.error('Get agent returns error:', error);
            return [];
        }
    }

    // Admin Data Methods
    async getAllUsers() {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const users = [];
            
            querySnapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            
            return users;
        } catch (error) {
            console.error('Get all users error:', error);
            return [];
        }
    }

    async getAllSales() {
        try {
            const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const sales = [];
            
            querySnapshot.forEach((doc) => {
                sales.push({ id: doc.id, ...doc.data() });
            });
            
            return sales;
        } catch (error) {
            console.error('Get all sales error:', error);
            return [];
        }
    }

    async getAllReturns() {
        try {
            const q = query(collection(db, 'returns'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const returns = [];
            
            querySnapshot.forEach((doc) => {
                returns.push({ id: doc.id, ...doc.data() });
            });
            
            return returns;
        } catch (error) {
            console.error('Get all returns error:', error);
            return [];
        }
    }

    async updateSaleStatus(saleId, status) {
        try {
            const docRef = doc(db, 'sales', saleId);
            await updateDoc(docRef, {
                status: status,
                updatedAt: new Date()
            });
            return { success: true };
        } catch (error) {
            console.error('Update sale status error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateReturnStatus(returnId, status) {
        try {
            const docRef = doc(db, 'returns', returnId);
            await updateDoc(docRef, {
                status: status,
                updatedAt: new Date()
            });
            return { success: true };
        } catch (error) {
            console.error('Update return status error:', error);
            return { success: false, error: error.message };
        }
    }

    // File Upload Methods
    async uploadProfilePhoto(userId, file) {
        try {
            const storageRef = ref(storage, `profile-photos/${userId}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Update user profile with photo URL
            await this.updateUserProfile(userId, { profilePhoto: downloadURL });
            
            return { success: true, url: downloadURL };
        } catch (error) {
            console.error('Upload photo error:', error);
            return { success: false, error: error.message };
        }
    }

    // Dashboard Statistics
    async getAgentStats(agentId) {
        try {
            const sales = await this.getAgentSales(agentId);
            const returns = await this.getAgentReturns(agentId);
            
            const totalSales = sales.length;
            const totalReturns = returns.length;
            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
            const successfulSales = sales.filter(sale => sale.status === 'completed').length;
            const successRate = totalSales > 0 ? (successfulSales / totalSales * 100).toFixed(1) : 0;
            
            return {
                totalSales,
                totalReturns,
                totalRevenue,
                successRate,
                pendingSales: sales.filter(sale => sale.status === 'pending').length,
                completedSales: successfulSales
            };
        } catch (error) {
            console.error('Get agent stats error:', error);
            return {};
        }
    }

    async getAdminStats() {
        try {
            const users = await this.getAllUsers();
            const sales = await this.getAllSales();
            const returns = await this.getAllReturns();
            
            const totalUsers = users.length;
            const totalAgents = users.filter(user => user.role === 'agent').length;
            const totalSales = sales.length;
            const totalReturns = returns.length;
            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
            
            return {
                totalUsers,
                totalAgents,
                totalSales,
                totalReturns,
                totalRevenue,
                pendingSales: sales.filter(sale => sale.status === 'pending').length,
                completedSales: sales.filter(sale => sale.status === 'completed').length
            };
        } catch (error) {
            console.error('Get admin stats error:', error);
            return {};
        }
    }

    // Utility Methods
    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentUserRole() {
        return this.userRole || localStorage.getItem('userRole');
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isAdmin() {
        return this.getCurrentUserRole() === 'admin';
    }

    isAgent() {
        return this.getCurrentUserRole() === 'agent';
    }
}

// Create and export a single instance
const firebaseService = new FirebaseService();
export default firebaseService;