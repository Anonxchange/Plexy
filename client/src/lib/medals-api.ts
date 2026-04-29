
import { createClient } from './supabase';

const supabase = createClient();

export interface UserMedalStats {
  totalTrades: number;
  totalVolume: number;
  currentStreak: number;
  tradesWithoutDisputes: number;
  volumeRanking: number;
  registrationDate: string;
  giftCardTrades: number;
  bankTransferTrades: number;
  mobileMoneyTrades: number;
  tradesWithoutCancellations: number;
}

export async function getUserMedalStats(userId: string): Promise<UserMedalStats> {
  try {
    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('total_trades, completed_trades, created_at')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch total trade volume
    const { data: volumeData, error: volumeError } = await supabase
      .from('p2p_trades')
      .select('fiat_amount')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'completed');

    const totalVolume = volumeData?.reduce((sum, trade) => sum + Number(trade.fiat_amount), 0) || 0;

    // Fetch trades without disputes
    const { data: disputeData, error: disputeError } = await supabase
      .from('p2p_trades')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'completed')
      .not('id', 'in', `(SELECT trade_id FROM disputes)`);

    const tradesWithoutDisputes = disputeData?.length || 0;

    // Fetch payment method specific trades
    const { data: paymentTrades, error: paymentError } = await supabase
      .from('p2p_trades')
      .select('payment_method')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'completed');

    const giftCardTrades = paymentTrades?.filter(t => 
      t.payment_method?.toLowerCase().includes('gift card')
    ).length || 0;

    const bankTransferTrades = paymentTrades?.filter(t => 
      t.payment_method?.toLowerCase().includes('bank transfer')
    ).length || 0;

    const mobileMoneyTrades = paymentTrades?.filter(t => 
      t.payment_method?.toLowerCase().includes('mobile money') ||
      t.payment_method?.toLowerCase().includes('momo')
    ).length || 0;

    // Calculate current streak (simplified - you may want to enhance this)
    const { data: recentTrades, error: streakError } = await supabase
      .from('p2p_trades')
      .select('completed_at')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(30);

    let currentStreak = 0;
    if (recentTrades && recentTrades.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let checkDate = new Date(today);
      for (const trade of recentTrades) {
        const tradeDate = new Date(trade.completed_at);
        tradeDate.setHours(0, 0, 0, 0);
        
        if (tradeDate.getTime() === checkDate.getTime()) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate volume ranking (simplified - top 1% if volume > 100000)
    const volumeRanking = totalVolume > 100000 ? 1 : totalVolume > 50000 ? 5 : 25;

    // Fetch trades without cancellations
    const { data: cancelData, error: cancelError } = await supabase
      .from('p2p_trades')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .neq('status', 'cancelled');

    const tradesWithoutCancellations = cancelData?.length || 0;

    return {
      totalTrades: profile?.total_trades || 0,
      totalVolume,
      currentStreak,
      tradesWithoutDisputes,
      volumeRanking,
      registrationDate: profile?.created_at || new Date().toISOString(),
      giftCardTrades,
      bankTransferTrades,
      mobileMoneyTrades,
      tradesWithoutCancellations,
    };
  } catch (error) {
    console.error('Error fetching medal stats:', error);
    return {
      totalTrades: 0,
      totalVolume: 0,
      currentStreak: 0,
      tradesWithoutDisputes: 0,
      volumeRanking: 100,
      registrationDate: new Date().toISOString(),
      giftCardTrades: 0,
      bankTransferTrades: 0,
      mobileMoneyTrades: 0,
      tradesWithoutCancellations: 0,
    };
  }
}
