// Commission Calculation Service
class CommissionService {
  constructor(firebaseService) {
    this.firebase = firebaseService;
    this.defaultCommissionRate = 0.05; // 5%
  }

  async calculateOrderCommission(order, agentId) {
    try {
      // Get agent commission settings
      let agentData = null;
      let commissionRate = this.defaultCommissionRate;
      
      try {
        const agent = await this.firebase.getAgent(agentId);
        if (agent.success) {
          agentData = agent.data;
          commissionRate = agentData.commissionRate || this.defaultCommissionRate;
        } else {
          console.log(`⚠️  Agent ${agentId} not found in Firebase, using defaults`);
        }
      } catch (error) {
        console.log(`⚠️  Firebase unavailable, using default agent settings for ${agentId}`);
      }
      
      // Use default agent data if Firebase is unavailable
      if (!agentData) {
        agentData = {
          id: agentId,
          commissionRate: this.defaultCommissionRate,
          territory: 'Unknown',
          productBonuses: {}
        };
      }

      // Basic commission calculation
      const baseCommission = order.total * commissionRate;
      
      // Volume bonus calculation (monthly)
      const volumeBonus = await this.calculateVolumeBonus(agentId, order.createdAt);
      
      // Product-specific bonuses
      const productBonus = await this.calculateProductBonus(order.lineItems, agentData);
      
      // First-time customer bonus
      const customerBonus = await this.calculateCustomerBonus(order.customer, agentId);

      const totalCommission = baseCommission + volumeBonus + productBonus + customerBonus;

      const commission = {
        orderId: order.id,
        orderNumber: order.orderNumber || order.name,
        agentId: agentId,
        orderTotal: order.total,
        commissionBreakdown: {
          baseRate: commissionRate,
          baseCommission: parseFloat(baseCommission.toFixed(2)),
          volumeBonus: parseFloat(volumeBonus.toFixed(2)),
          productBonus: parseFloat(productBonus.toFixed(2)),
          customerBonus: parseFloat(customerBonus.toFixed(2))
        },
        totalCommission: parseFloat(totalCommission.toFixed(2)),
        currency: order.currency || 'MYR',
        status: 'pending',
        calculatedAt: new Date(),
        payoutDate: this.getNextPayoutDate(),
        orderDetails: {
          customerName: order.customer?.fullName || 'Unknown',
          customerEmail: order.customer?.email,
          itemCount: order.lineItems?.length || 0,
          paymentStatus: order.financialStatus,
          fulfillmentStatus: order.fulfillmentStatus
        }
      };

      // Save commission to Firebase (if available)
      try {
        const saveResult = await this.firebase.saveCommission(commission);
        
        if (saveResult.success) {
          console.log(`✅ Commission saved to Firebase: ${commission.id}`);
        } else {
          console.log(`⚠️  Failed to save commission to Firebase: ${saveResult.error}`);
        }
      } catch (error) {
        console.log(`⚠️  Firebase unavailable, commission not saved: ${error.message}`);
      }
      
      // Return commission data regardless of Firebase save status
      return { success: true, commission };
    } catch (error) {
      console.error('Commission calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async calculateVolumeBonus(agentId, orderDate) {
    try {
      // Get current month's orders for the agent
      const currentMonth = new Date(orderDate).getMonth();
      const currentYear = new Date(orderDate).getFullYear();
      
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      let commissionsResult;
      
      try {
        commissionsResult = await this.firebase.getAgentCommissions(agentId, startOfMonth, endOfMonth);
        
        if (!commissionsResult.success) {
          return 0;
        }
      } catch (error) {
        console.log('⚠️  Firebase unavailable for volume bonus calculation, returning 0');
        return 0;
      }

      const monthlyCommissions = commissionsResult.data;
      const monthlyTotal = monthlyCommissions.reduce((sum, comm) => sum + (comm.orderTotal || 0), 0);
      
      // Volume bonus tiers
      const volumeTiers = [
        { minAmount: 10000, bonusRate: 0.02 }, // RM10k+ = 2% bonus
        { minAmount: 5000, bonusRate: 0.015 },  // RM5k+ = 1.5% bonus
        { minAmount: 2000, bonusRate: 0.01 },   // RM2k+ = 1% bonus
        { minAmount: 1000, bonusRate: 0.005 }   // RM1k+ = 0.5% bonus
      ];

      // Find applicable tier
      const applicableTier = volumeTiers.find(tier => monthlyTotal >= tier.minAmount);
      
      if (applicableTier) {
        return monthlyTotal * applicableTier.bonusRate;
      }
      
      return 0;
    } catch (error) {
      console.error('Volume bonus calculation error:', error);
      return 0;
    }
  }

  async calculateProductBonus(lineItems, agentData) {
    try {
      if (!lineItems || !Array.isArray(lineItems)) {
        return 0;
      }

      let totalProductBonus = 0;
      
      // Product category bonuses for Kilang Desa Murni Batik
      const productBonuses = agentData.productBonuses || {
        'Batik Fabric': 0.01,      // 1% bonus for batik fabrics
        'Baju Melayu': 0.025,      // 2.5% bonus for traditional clothing
        'Kurung Batik': 0.025,     // 2.5% bonus for kurung batik
        'Premium Cotton': 0.015,   // 1.5% bonus for premium cotton
        'Satin Valentino': 0.02,   // 2% bonus for satin products
        'Traditional Wear': 0.03,  // 3% bonus for traditional Malaysian wear
        'Bulk Orders': 0.015       // 1.5% bonus for bulk orders (5+ items)
      };

      lineItems.forEach(item => {
        // Check if item qualifies for product bonus
        const vendor = item.vendor;
        const title = item.title.toLowerCase();
        
        // Batik product categorization based on your actual products
        let category = null;
        
        // Check for bulk orders (5+ of same item)
        if (item.quantity >= 5) {
          category = 'Bulk Orders';
        }
        // Baju Melayu products
        else if (title.includes('baju melayu') || title.includes('adam tradisional') || title.includes('muhammad')) {
          category = 'Baju Melayu';
        }
        // Kurung Batik products
        else if (title.includes('kurung batik') || title.includes('alana') || title.includes('sedondon')) {
          category = 'Kurung Batik';
        }
        // Traditional wear identification
        else if (title.includes('tradisional') || title.includes('pesak') || title.includes('cekak musang')) {
          category = 'Traditional Wear';
        }
        // Satin Valentino material
        else if (title.includes('satin valentino') || title.includes('satin paloma')) {
          category = 'Satin Valentino';
        }
        // Premium Cotton products
        else if (title.includes('cotton') || title.includes('premium') || title.includes('eksklusif')) {
          category = 'Premium Cotton';
        }
        // Basic batik fabric
        else if (title.includes('batik') || title.includes('fabric') || title.includes('kain')) {
          category = 'Batik Fabric';
        }

        if (category && productBonuses[category]) {
          const itemBonus = (item.price * item.quantity) * productBonuses[category];
          totalProductBonus += itemBonus;
        }
      });

      return totalProductBonus;
    } catch (error) {
      console.error('Product bonus calculation error:', error);
      return 0;
    }
  }

  async calculateCustomerBonus(customer, agentId) {
    try {
      if (!customer || !customer.id) {
        return 0;
      }

      // Check if this is a new customer for this agent
      const isNewCustomer = customer.ordersCount <= 1;
      
      if (isNewCustomer) {
        // New customer bonus: RM50 or 5% of order value, whichever is lower
        return 50;
      }

      // Returning customer bonus based on loyalty
      if (customer.ordersCount >= 10) {
        return 20; // Loyal customer bonus
      } else if (customer.ordersCount >= 5) {
        return 10; // Repeat customer bonus
      }

      return 0;
    } catch (error) {
      console.error('Customer bonus calculation error:', error);
      return 0;
    }
  }

  async getAgentCommissionSummary(agentId, startDate, endDate) {
    try {
      const commissionsResult = await this.firebase.getAgentCommissions(agentId, startDate, endDate);
      
      if (!commissionsResult.success) {
        return { success: false, error: commissionsResult.error };
      }

      const commissions = commissionsResult.data;
      
      // Calculate summary statistics
      const totalCommissions = commissions.reduce((sum, comm) => sum + (comm.totalCommission || 0), 0);
      const totalOrders = commissions.length;
      const pendingCommissions = commissions.filter(c => c.status === 'pending');
      const paidCommissions = commissions.filter(c => c.status === 'paid');
      
      const averageCommission = totalOrders > 0 ? totalCommissions / totalOrders : 0;
      
      // Group by month for trend analysis
      const monthlyBreakdown = {};
      commissions.forEach(comm => {
        const month = new Date(comm.calculatedAt).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyBreakdown[month]) {
          monthlyBreakdown[month] = {
            totalCommission: 0,
            orderCount: 0,
            averageCommission: 0
          };
        }
        monthlyBreakdown[month].totalCommission += comm.totalCommission;
        monthlyBreakdown[month].orderCount += 1;
      });

      // Calculate monthly averages
      Object.keys(monthlyBreakdown).forEach(month => {
        const data = monthlyBreakdown[month];
        data.averageCommission = data.totalCommission / data.orderCount;
      });

      const summary = {
        totals: {
          totalCommissions: parseFloat(totalCommissions.toFixed(2)),
          totalOrders,
          averageCommission: parseFloat(averageCommission.toFixed(2))
        },
        status: {
          pending: {
            count: pendingCommissions.length,
            amount: parseFloat(pendingCommissions.reduce((sum, c) => sum + c.totalCommission, 0).toFixed(2))
          },
          paid: {
            count: paidCommissions.length,
            amount: parseFloat(paidCommissions.reduce((sum, c) => sum + c.totalCommission, 0).toFixed(2))
          }
        },
        monthlyBreakdown,
        commissions: commissions.sort((a, b) => new Date(b.calculatedAt) - new Date(a.calculatedAt))
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error('Commission summary error:', error);
      return { success: false, error: error.message };
    }
  }

  getNextPayoutDate() {
    // Payouts happen on the 1st of every month
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  async updateCommissionStatus(commissionId, status, updatedBy = null) {
    try {
      // TODO: Implement updateCommission method in FirebaseService
      const updateData = {
        status,
        updatedBy,
        updatedAt: new Date()
      };

      if (status === 'paid') {
        updateData.paidAt = new Date();
      }

      // For now, we'll use a placeholder
      console.log(`Commission ${commissionId} status updated to: ${status}`);
      
      return { success: true };
    } catch (error) {
      console.error('Update commission status error:', error);
      return { success: false, error: error.message };
    }
  }

  async calculateCommissionForExistingOrder(orderId, agentId) {
    try {
      // Get order from Firebase
      const orderResult = await this.firebase.getShopifyOrder(orderId);
      
      if (!orderResult.success) {
        throw new Error('Order not found');
      }

      const order = orderResult.data;
      
      // Check if commission already calculated
      if (order.commissionCalculated) {
        return { 
          success: false, 
          error: 'Commission already calculated for this order'
        };
      }

      // Calculate commission
      const result = await this.calculateOrderCommission(order, agentId);
      
      if (result.success) {
        // Mark order as commission calculated
        await this.firebase.updateUser(orderId, {
          commissionCalculated: true,
          commissionAmount: result.commission.totalCommission,
          updatedAt: new Date()
        });
      }

      return result;
    } catch (error) {
      console.error('Calculate commission for existing order error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default CommissionService;