import supabase from '../config/supabase.js';
import { Notification } from '../models/Notification.js';

/**
 * Notification Service - handles notification operations
 */
export class NotificationService {
  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {number} limit - Limit results
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Notification[]>} Array of notifications
   */
  static async listNotifications(userId, limit = 50, offset = 0) {
    const notifications = await Notification.findByUserId(userId, { 
      limit: limit 
    });
    
    // Apply offset manually since we're doing it in memory for simplicity
    // In a real app with large datasets, we'd do this in the query
    return notifications.slice(offset || 0);
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  /**
   * Create a new notification
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} type - Notification type (info, warning, error, success, order, kyc, alert, market)
   * @param {string|null} message - Optional message
   * @param {Object|null} data - Optional additional data
   * @returns {Promise<Notification>} Created notification
   */
  static async createNotification(userId, title, type, message = null, data = null) {
    return await Notification.create({
      user_id: userId,
      title: title,
      message: message,
      kind: type,
      data: data
    });
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Notification>} Updated notification
   */
  static async markAsRead(notificationId, userId) {
    return await Notification.markAsRead(notificationId, userId);
  }

  /**
   * Mark notification as unread
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Notification>} Updated notification
   */
  static async markAsUnread(notificationId, userId) {
    return await Notification.markAsUnread(notificationId, userId);
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications marked as read
   */
  static async markAllAsRead(userId) {
    return await Notification.markAllAsRead(userId);
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} True if deleted
   */
  static async deleteNotification(notificationId, userId) {
    return await Notification.delete(notificationId, userId);
  }

  /**
   * Delete all notifications for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications deleted
   */
  static async deleteAllNotifications(userId) {
    return await Notification.deleteAll(userId);
  }

  /**
   * Create a notification for order events
   * @param {string} userId - User ID
   * @param {string} orderId - Order ID
   * @param {string} event - Event type (placed, filled, cancelled, rejected)
   * @param {Object} orderDetails - Order details
   * @returns {Promise<Notification>} Created notification
   */
  static async createOrderNotification(userId, orderId, event, orderDetails) {
    let title = '';
    let message = '';
    
    switch (event) {
      case 'placed':
        title = 'Order Placed';
        message = `Your ${orderDetails.side} order for ${orderDetails.quantity} ${orderDetails.symbol} has been placed.`;
        break;
      case 'filled':
        title = 'Order Filled';
        message = `Your ${orderDetails.side} order for ${orderDetails.quantity} ${orderDetails.symbol} has been filled at ₹${orderDetails.price.toFixed(2)}.`;
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your ${orderDetails.side} order for ${orderDetails.quantity} ${orderDetails.symbol} has been cancelled.`;
        break;
      case 'rejected':
        title = 'Order Rejected';
        message = `Your ${orderDetails.side} order for ${orderDetails.quantity} ${orderDetails.symbol} has been rejected: ${orderDetails.reason || 'Unknown reason'}.`;
        break;
      default:
        title = 'Order Update';
        message = `Your order has been updated.`;
    }
    
    return this.createNotification(userId, title, 'order', message, {
      orderId: orderId,
      event: event,
      ...orderDetails
    });
  }

  /**
   * Create a notification for KYC events
   * @param {string} userId - User ID
   * @param {string} event - Event type (submitted, approved, rejected)
   * @param {Object} kycDetails - KYC details
   * @returns {Promise<Notification>} Created notification
   */
  static async createKYCNotification(userId, event, kycDetails) {
    let title = '';
    let message = '';
    
    switch (event) {
      case 'submitted':
        title = 'KYC Submitted';
        message = 'Your KYC documents have been submitted for review.';
        break;
      case 'approved':
        title = 'KYC Approved';
        message = 'Congratulations! Your KYC has been approved. You can now start trading.';
        break;
      case 'rejected':
        title = 'KYC Rejected';
        message = `Your KYC has been rejected: ${kycDetails.reason || 'Please check your documents and try again.'}`;
        break;
      default:
        title = 'KYC Update';
        message = 'Your KYC status has been updated.';
    }
    
    return this.createNotification(userId, title, 'kyc', message, {
      event: event,
      ...kycDetails
    });
  }

  /**
   * Create a notification for price alerts
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @param {string} condition - Price condition (above/below)
   * @param {number} targetPrice - Target price
   * @param {number} currentPrice - Current price when triggered
   * @returns {Promise<Notification>} Created notification
   */
  static async createPriceAlertNotification(userId, symbol, condition, targetPrice, currentPrice) {
    const conditionText = condition === 'above' ? 'above' : 'below';
    const title = 'Price Alert Triggered';
    const message = `${symbol} is now ${conditionText} ₹${targetPrice.toFixed(2)} (current: ₹${currentPrice.toFixed(2)})`;
    
    return this.createNotification(userId, title, 'alert', message, {
      symbol: symbol,
      condition: condition,
      targetPrice: targetPrice,
      triggeredPrice: currentPrice
    });
  }

  /**
   * Create a system notification
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, warning, error, success)
   * @returns {Promise<Notification>} Created notification
   */
  static async createSystemNotification(userId, title, message, type = 'info') {
    return this.createNotification(userId, title, type, message);
  }
}

export default NotificationService;

// Named function export used by notificationController
export const listNotifications = (userId, limit, offset) =>
  NotificationService.listNotifications(userId, limit, offset);

export const createNotification = (...args) =>
  NotificationService.createNotification(...args);