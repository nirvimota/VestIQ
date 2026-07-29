import supabase from '../config/supabase.js';

/**
 * Audit Log Service - handles logging of important actions for compliance and debugging
 */
export class AuditLogService {
  /**
   * Log an action
   * @param {string} userId - User ID (can be null for system actions)
   * @param {string} action - Action description
   * @param {Object} metadata - Additional data about the action
   * @param {string} ipAddress - IP address of the user (optional)
   * @param {string} userAgent - User agent string (optional)
   * @returns {Promise<Object>} Created audit log entry
   */
  static async logAction(userId, action, metadata = {}, ipAddress = null, userAgent = null) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: action,
          metadata: metadata,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single();
      
      if (error) {
        // Don't throw error for audit logging failures to avoid disrupting main flow
        console.error('[AuditLogService] Failed to log action:', error.message);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('[AuditLogService] Error in logAction:', error);
      return null;
    }
  }

  /**
   * Log user authentication events
   * @param {string} userId - User ID
   * @param {string} event - Event type (login, logout, failed_login, etc.)
   * @param {Object} details - Additional details
   * @param {string} ipAddress - IP address
   * @returns {Promise<void>}
   */
  static async logAuthEvent(userId, event, details = {}, ipAddress = null) {
    await this.logAction(
      userId,
      `AUTH_${event.toUpperCase()}`,
      {
        ...details,
        event: event,
        timestamp: new Date().toISOString()
      },
      ipAddress
    );
  }

  /**
   * Log order-related events
   * @param {string} userId - User ID
   * @param {string} event - Event type (order_placed, order_cancelled, order_filled, etc.)
   * @param {Object} orderDetails - Order details
   * @returns {Promise<void>}
   */
  static async logOrderEvent(userId, event, orderDetails) {
    await this.logAction(
      userId,
      `ORDER_${event.toUpperCase()}`,
      {
        ...orderDetails,
        event: event,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * log portfolio/transaction events
   * @param {string} userId - User ID
   * @param {string} event - Event type (deposit, withdrawal, dividend_received, etc.)
   * @param {Object} transactionDetails - Transaction details
   * @returns {Promise<void>}
   */
  static async logTransactionEvent(userId, event, transactionDetails) {
    await this.logAction(
      userId,
      `TRANSACTION_${event.toUpperCase()}`,
      {
        ...transactionDetails,
        event: event,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Log KYC-related events
   * @param {string} userId - User ID
   * @param {string} event - Event type (kyc_submitted, kyc_approved, kyc_rejected, etc.)
   * @param {Object} kycDetails - KYC details
   * @returns {Promise<void>}
   */
  static async logKYCEvent(userId, event, kycDetails) {
    await this.logAction(
      userId,
      `KYC_${event.toUpperCase()}`,
      {
        ...kycDetails,
        event: event,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Log security-related events
   * @param {string} userId - User ID (can be null for failed attempts)
   * @param {string} event - Event type (password_change, 2fa_enabled, suspicious_activity, etc.)
   * @param {Object} securityDetails - Security details
   * @param {string} ipAddress - IP address
   * @returns {Promise<void>}
   */
  static async logSecurityEvent(userId, event, securityDetails, ipAddress = null) {
    await this.logAction(
      userId,
      `SECURITY_${event.toUpperCase()}`,
      {
        ...securityDetails,
        event: event,
        timestamp: new Date().toISOString()
      },
      ipAddress
    );
  }

  /**
   * Log system/admin events
   * @param {string} adminId - Admin user ID (can be null for system actions)
   * @param {string} event - Event type (system_update, maintenance_start, etc.)
   * @param {Object} details - Event details
   * @returns {Promise<void>}
   */
  static async logSystemEvent(adminId, event, details) {
    await this.logAction(
      adminId,
      `SYSTEM_${event.toUpperCase()}`,
      {
        ...details,
        event: event,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Get audit logs for a user
   * @param {string} userId - User ID
   * @param {Object} options - Filter options (limit, actionType, dateRange, etc.)
   * @returns {Promise<Array>} Audit log entries
   */
  static async getUserAuditLogs(userId, options = {}) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.actionType) {
      query = query.like('action', `${options.actionType.toUpperCase()}%`);
    }
    
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get audit logs for admin review (filtered by action type or date)
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Audit log entries
   */
  static async getAuditLogsForReview(filters = {}) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.actionType) {
      query = query.like('action', `${filters.actionType.toUpperCase()}%`);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get audit statistics
   * @param {Object} options - Options (dateRange, etc.)
   * @returns {Promise<Object>} Audit statistics
   */
  static async getStatistics(options = {}) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('action, user_id');
      
      // Apply date filter if provided
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Process statistics
      const stats = {
        totalActions: data.length,
        uniqueUsers: new Set(data.map(item => item.user_id)).size,
        actionsByType: {},
        actionsByUser: {},
        recentActivity: []
      };
      
      // Count actions by type
      data.forEach(log => {
        const actionType = log.action.split('_')[0]; // Get first part before underscore
        stats.actionsByType[actionType] = (stats.actionsByType[actionType] || 0) + 1;
        
        // Count by user (if user_id exists)
        if (log.user_id) {
          stats.actionsByUser[log.user_id] = (stats.actionsByUser[log.user_id] || 0) + 1;
        }
      });
      
      // Get recent activity (last 10)
      let recentQuery = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (options.startDate) {
        recentQuery = recentQuery.gte('created_at', options.startDate);
      }
      if (options.endDate) {
        recentQuery = recentQuery.lte('created_at', options.endDate);
      }
      
      const { data: recentData } = await recentQuery;
      stats.recentActivity = recentData.map(log => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        timestamp: log.created_at
      }));
      
      return stats;
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      return {
        totalActions: 0,
        uniqueUsers: 0,
        actionsByType: {},
        actionsByUser: {},
        recentActivity: []
      };
    }
  }

  /**
   * Delete old audit logs (for data retention compliance)
   * @param {string} cutoffDate - Date before which to delete logs (ISO string)
   * @returns {Promise<number>} Number of records deleted
   */
  static async deleteOldLogs(cutoffDate) {
    const { count, error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate);
    
    if (error) throw error;
    return count || 0;
  }
}

export default AuditLogService;

// Named function export used by orderController
export const logAction = (...args) => AuditLogService.logAction(...args);