/**
 * Table: orders
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} user_id
 * @property {string} symbol
 * @property {'buy'|'sell'} side
 * @property {'market'|'limit'|'stop-loss'} order_type
 * @property {number} quantity
 * @property {number|null} price
 * @property {'pending'|'filled'|'partial'|'rejected'|'cancelled'} status
 * @property {string} created_at
 */
export {};