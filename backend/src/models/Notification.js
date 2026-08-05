import supabase from '../config/supabase.js';

/**
 * Notification model - represents a notification for a user
 * Maps to public.notifications table
 */
export class Notification {
  /**
   * @param {Object} data - Notification data
   * @param {string} data.id - Notification ID
   * @param {string} data.user_id - User ID
   * @param {string} data.title - Notification title
   * @param {string|null} data.message - Notification message
   * @param {'info'|'warning'|'error'|'success'|'order'|'kyc'|'alert'|'market'} data.kind - Notification type
   * @param {boolean} data.is_read - Whether notification has been read
   * @param {Object|null} data.data - Additional data as JSON
   * @param {string} data.created_at - Creation timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.title = data.title;
    this.message = data.message || null;
    this.kind = data.kind;
    this.is_read = data.is_read !== undefined ? data.is_read : false;
    this.data = data.data || null;
    this.created_at = data.created_at;
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Options (limit, unreadOnly, etc.)
   * @returns {Promise<Notification[]>} Array of notifications
   */
  static async findByUserId(userId, options = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.unreadOnly) {
      query = query.eq('is_read', false);
    }
    
    if (options.kind) {
      query = query.eq('kind', options.kind);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data.map(notification => new Notification(notification));
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    return count || 0;
  }

  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Notification>} Created notification
   */
  static async create(notificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        title: notificationData.title,
        message: notificationData.message || null,
        kind: notificationData.kind,
        is_read: notificationData.is_read || false,
        data: notificationData.data || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return new Notification(data);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Notification>} Updated notification
   */
  static async markAsRead(notificationId, userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return new Notification(data);
  }

  /**
   * Mark notification as unread
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Notification>} Updated notification
   */
  static async markAsUnread(notificationId, userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: false })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return new Notification(data);
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications updated
   */
  static async markAllAsRead(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    return count || 0;
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(notificationId, userId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }

  /**
   * Delete all notifications for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications deleted
   */
  static async deleteAll(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    return count || 0;
  }
}

export default Notification;