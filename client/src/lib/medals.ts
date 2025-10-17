import medalTheOg from '@assets/generated_images/Golden_1_with_laurel_medal_icon_da8f22e7.png';
import medalInitiate from '@assets/generated_images/Military_chevron_rank_medal_icon_b880fdfb.png';
import medalDecaDealer from '@assets/generated_images/Money_bags_trading_volume_icon_8b31dde5.png';
import medalGiftCard from '@assets/generated_images/Gift_card_with_star_icon_56942569.png';
import medalBankTransfer from '@assets/generated_images/Money_bag_with_crown_icon_ba87dcf5.png';
import medalMoMo from '@assets/generated_images/Mobile_payment_cards_icon_25a07f21.png';
import medalEveryDay from '@assets/generated_images/Calendar_30_day_streak_icon_2b86d28c.png';
import medalCleanSheet from '@assets/generated_images/Shield_with_crown_icon_fc6d7536.png';
import medalNoSlip from '@assets/generated_images/Bronze_star_badge_icon_c33b3fa3.png';
import medalTop1 from '@assets/generated_images/Diamond_with_star_icon_fe87fa91.png';

export interface Medal {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'trading' | 'streak' | 'achievement';
  requirement: {
    type: 'trades_count' | 'trade_volume' | 'streak' | 'payment_method' | 'no_disputes' | 'ranking';
    value: number;
    unit?: string;
  };
  progress?: number;
  earned?: boolean;
  earnedDate?: string;
}

export const medals: Medal[] = [
  {
    id: 'the-og',
    name: 'The OG',
    description: 'Welcome to Pexly! Earned upon registration',
    icon: medalTheOg,
    category: 'milestone',
    requirement: {
      type: 'trades_count',
      value: 0,
    },
  },
  {
    id: 'noones-initiate',
    name: 'Pexly Initiate',
    description: 'First 10 trades',
    icon: medalInitiate,
    category: 'milestone',
    requirement: {
      type: 'trades_count',
      value: 10,
    },
  },
  {
    id: 'deca-dealer',
    name: 'Deca Dealer',
    description: 'Trade volume of 10,000 USD',
    icon: medalDecaDealer,
    category: 'trading',
    requirement: {
      type: 'trade_volume',
      value: 10000,
      unit: 'USD',
    },
  },
  {
    id: 'gift-card-savage',
    name: 'Gift Card Savage',
    description: '100 Gift Card trades',
    icon: medalGiftCard,
    category: 'trading',
    requirement: {
      type: 'payment_method',
      value: 100,
    },
  },
  {
    id: 'bank-transfer-boss',
    name: 'Bank Transfer Boss',
    description: '100 Bank Transfer trades',
    icon: medalBankTransfer,
    category: 'trading',
    requirement: {
      type: 'payment_method',
      value: 100,
    },
  },
  {
    id: 'momo-master',
    name: 'MoMo Master',
    description: '100+ mobile money trades',
    icon: medalMoMo,
    category: 'trading',
    requirement: {
      type: 'payment_method',
      value: 100,
    },
  },
  {
    id: 'every-damn-day',
    name: 'Every Damn Day',
    description: '1+ trade per day for 30 days',
    icon: medalEveryDay,
    category: 'streak',
    requirement: {
      type: 'streak',
      value: 30,
    },
  },
  {
    id: 'clean-sheet',
    name: 'Clean Sheet',
    description: '100 trades in a row without a single dispute',
    icon: medalCleanSheet,
    category: 'achievement',
    requirement: {
      type: 'no_disputes',
      value: 100,
    },
  },
  {
    id: 'no-slip-zone',
    name: 'No Slip Zone',
    description: '100+ trades with zero cancellations',
    icon: medalNoSlip,
    category: 'achievement',
    requirement: {
      type: 'trades_count',
      value: 100,
    },
  },
  {
    id: 'top-1-club',
    name: 'Top 1% Club',
    description: 'Ranked in top 1% by total volume',
    icon: medalTop1,
    category: 'achievement',
    requirement: {
      type: 'ranking',
      value: 1,
      unit: '%',
    },
  },
];

export const getMedalProgress = (medal: Medal, userStats: any): number => {
  const { requirement } = medal;
  
  switch (requirement.type) {
    case 'trades_count':
      return Math.min((userStats.totalTrades / requirement.value) * 100, 100);
    case 'trade_volume':
      return Math.min((userStats.totalVolume / requirement.value) * 100, 100);
    case 'streak':
      return Math.min((userStats.currentStreak / requirement.value) * 100, 100);
    case 'no_disputes':
      return Math.min((userStats.tradesWithoutDisputes / requirement.value) * 100, 100);
    case 'ranking':
      return userStats.volumeRanking <= requirement.value ? 100 : 0;
    case 'payment_method':
      // Check which medal this is to get the right count
      if (medal.id === 'gift-card-savage') {
        return Math.min((userStats.giftCardTrades / requirement.value) * 100, 100);
      } else if (medal.id === 'bank-transfer-boss') {
        return Math.min((userStats.bankTransferTrades / requirement.value) * 100, 100);
      } else if (medal.id === 'momo-master') {
        return Math.min((userStats.mobileMoneyTrades / requirement.value) * 100, 100);
      }
      return 0;
    default:
      return 0;
  }
};

export const isMedalEarned = (medal: Medal, userStats: any): boolean => {
  // The OG medal is automatically earned upon registration
  if (medal.id === 'the-og') {
    return true;
  }
  return getMedalProgress(medal, userStats) === 100;
};
