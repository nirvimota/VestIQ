import supabase from '../config/supabase.js';
import { getQuote } from '../services/marketDataService.js';
import { NotificationService } from '../services/notificationService.js';

export async function runAlertCheck() {
  const { data: alerts, error } = await supabase.from('price_alerts').select('*').eq('triggered', false);
  if (error) {
    console.error('[alertJob] failed to load alerts:', error.message);
    return;
  }

  for (const alert of alerts) {
    const quote = await getQuote(alert.symbol);
    if (!quote) continue;

    const crossed =
      (alert.direction === 'above' && quote.price >= alert.target_price) ||
      (alert.direction === 'below' && quote.price <= alert.target_price);

    if (crossed) {
      await NotificationService.createNotification(alert.user_id, `${alert.symbol} crossed ₹${alert.target_price}`, 'price');
      await supabase.from('price_alerts').update({ triggered: true }).eq('id', alert.id);
    }
  }
}