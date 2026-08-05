import supabase from '../config/supabase.js';

/**
 * Alert model - represents a price alert set by a user
 * Maps to public.alerts table
 */
export class Alert {
  /**
   * @param {Object} data - Alert data
   * @param {string} data.id - Alert ID
   * @param {string} data.user_id - User ID
   * @param {string} data.symbol - Stock symbol
   * @param {'above'|'below'|'equals'} data.condition - Price condition
   * @param {number} data.target_price - Target price to trigger alert
   * @param {boolean} data.is_active - Whether alert is active
   * @param {string|null} data.triggered_at - When alert was triggered
   * @param {string} data.created_at - Alert creation timestamp
   * @param {string} data.updated_at - Last update timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.symbol = data.symbol;
    this.condition = data.condition;
    this.target_price = parseFloat(data.target_price) || 0;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.triggered_at = data.triggered_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get alerts for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters (activeOnly, symbol, etc.)
   * @returns {Promise<Alert[]>} Array of alerts
   */
  static async findByUserId(userId, filters = {}) {
    let query = supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId);
    
    if (filters.activeOnly !== undefined) {
      query = query.eq('is_active', filters.activeOnly);
    }
    
    if (filters.symbol) {
      query = query.eq('symbol', filters.symbol.toUpperCase());
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(alert => new Alert(alert));
  }

  /**
   * Get active alerts that need to be checked against current prices
   * @returns {Promise<Alert[]>} Array of active alerts
   */
  static async getActiveAlerts() {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_active', true)
      .is('triggered_at', null);
    
    if (error) throw error;
    return data.map(alert => new Alert(alert));
  }

  /**
   * Create a new alert
   * @param {Object} alertData - Alert data
   * @returns {Promise<Alert>} Created alert
   */
  static async create(alertData) {
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        user_id: alertData.user_id,
        symbol: alertData.symbol.toUpperCase(),
        condition: alertData.condition,
        target_price: alertData.target_price,
        is_active: alertData.is_active !== undefined ? alertData.is_active : true
      })
      .select()
      .single();
    
    if (error) throw error;
    return new Alert(data);
  }

  /**
   * Update an alert
   * @param {string} alertId - Alert ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Alert>} Updated alert
   */
  static async update(alertId, updates) {
    const { data, error } = await supabase
      .from('alerts')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();
    
    if (error) throw error;
    return new Alert(data);
  }

  /**
   * Delete an alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(alertId) {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId);
    
    if (error) throw error;
    return true;
  }

  /**
   * Mark alert as triggered
   * @param {string} alertId - Alert ID
   * @returns {Promise<Alert>} Updated alert
   */
  static async trigger(alertId) {
    return this.update(alertId, {
      is_active: false,
      triggered_at: new Date().toISOString()
    });
  }

  /**
   * Deactivate an alert without triggering
   * @param {string} alertId - Alert ID
   * @returns {Promise<Alert>} Updated alert
   */
  static async deactivate(alertId) {
    return this.update(alertId, { is_active: false });
  }

  /**
   * Activate an alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<Alert>} Updated alert
   */
  static async activate(alertId) {
    return this.update(alertId, { is_active: true, triggered_at: null });
  }
}