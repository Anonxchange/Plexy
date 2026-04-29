
import { createClient } from '../supabase';

export interface RiskScore {
  score: number; // 0-100, higher = more risky
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  blocked: boolean;
  requiresReview: boolean;
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  weight: number;
}

interface TransactionContext {
  user_id: string;
  amount: number;
  crypto_symbol: string;
  to_address?: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'swap' | 'send';
  ip_address?: string;
  device_fingerprint?: string;
}

class RiskEngine {
  private supabase = createClient();
  private readonly CRITICAL_THRESHOLD = 80;
  private readonly HIGH_THRESHOLD = 60;
  private readonly MEDIUM_THRESHOLD = 40;

  async screenTransaction(context: TransactionContext): Promise<RiskScore> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // 1. Check user behavior patterns
    const behaviorScore = await this.analyzeBehaviorPattern(context, factors);
    totalScore += behaviorScore;

    // 2. Check velocity (rapid transactions)
    const velocityScore = await this.analyzeVelocity(context, factors);
    totalScore += velocityScore;

    // 3. Check amount anomalies
    const amountScore = await this.analyzeAmount(context, factors);
    totalScore += amountScore;

    // 4. Check address reputation (for withdrawals)
    if (context.to_address) {
      const addressScore = await this.analyzeAddressReputation(context, factors);
      totalScore += addressScore;
    }

    // 5. Check device/IP reputation
    const deviceScore = await this.analyzeDevice(context, factors);
    totalScore += deviceScore;

    // 6. Check account age and verification
    const accountScore = await this.analyzeAccount(context, factors);
    totalScore += accountScore;

    // 7. Check for known fraud patterns
    const patternScore = await this.detectFraudPatterns(context, factors);
    totalScore += patternScore;

    const level = this.calculateRiskLevel(totalScore);
    const blocked = totalScore >= this.CRITICAL_THRESHOLD;
    const requiresReview = totalScore >= this.HIGH_THRESHOLD && !blocked;

    const riskScore: RiskScore = {
      score: Math.min(100, totalScore),
      level,
      factors,
      blocked,
      requiresReview,
    };

    // Log the risk assessment
    await this.logRiskAssessment(context, riskScore);

    return riskScore;
  }

  private async analyzeBehaviorPattern(context: TransactionContext, factors: RiskFactor[]): Promise<number> {
    let score = 0;

    try {
      // Get recent transaction history
      const { data: recentTxs } = await this.supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', context.user_id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (recentTxs) {
        // Check for unusual time of day
        const hour = new Date().getHours();
        const nightTransactions = recentTxs.filter(tx => {
          const txHour = new Date(tx.created_at).getHours();
          return txHour >= 23 || txHour <= 5;
        });

        if (nightTransactions.length > 5 && (hour >= 23 || hour <= 5)) {
          score += 15;
          factors.push({
            type: 'unusual_time',
            severity: 'medium',
            description: 'Multiple transactions during unusual hours',
            weight: 15,
          });
        }

        // Check for sudden behavior change
        const avgAmount = recentTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / recentTxs.length;
        if (context.amount > avgAmount * 5) {
          score += 20;
          factors.push({
            type: 'amount_spike',
            severity: 'high',
            description: 'Transaction amount significantly exceeds average',
            weight: 20,
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing behavior pattern:', error);
    }

    return score;
  }

  private async analyzeVelocity(context: TransactionContext, factors: RiskFactor[]): Promise<number> {
    let score = 0;

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Count transactions in last hour
      const { count: hourCount } = await this.supabase
        .from('wallet_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', context.user_id)
        .eq('type', context.type)
        .gte('created_at', oneHourAgo.toISOString());

      if (hourCount && hourCount > 10) {
        score += 25;
        factors.push({
          type: 'high_velocity',
          severity: 'critical',
          description: `${hourCount} ${context.type} transactions in last hour`,
          weight: 25,
        });
      } else if (hourCount && hourCount > 5) {
        score += 15;
        factors.push({
          type: 'elevated_velocity',
          severity: 'high',
          description: `${hourCount} ${context.type} transactions in last hour`,
          weight: 15,
        });
      }
    } catch (error) {
      console.error('Error analyzing velocity:', error);
    }

    return score;
  }

  private async analyzeAmount(context: TransactionContext, factors: RiskFactor[]): Promise<number> {
    let score = 0;

    // Check for round numbers (common in fraud)
    if (context.amount % 1000 === 0 && context.amount > 5000) {
      score += 10;
      factors.push({
        type: 'round_amount',
        severity: 'low',
        description: 'Transaction uses suspiciously round number',
        weight: 10,
      });
    }

    // Check for unusually large amounts
    if (context.type === 'withdrawal' && context.amount > 50000) {
      score += 20;
      factors.push({
        type: 'large_withdrawal',
        severity: 'high',
        description: 'Large withdrawal amount',
        weight: 20,
      });
    }

    return score;
  }

  private async analyzeAddressReputation(context: TransactionContext, factors: RiskFactor[]): Promise<number> {
    let score = 0;

    if (!context.to_address) return score;

    try {
      // Check if address has been flagged before
      const { count: flaggedCount } = await this.supabase
        .from('flagged_addresses')
        .select('id', { count: 'exact', head: true })
        .eq('address', context.to_address)
        .eq('crypto_symbol', context.crypto_symbol);

      if (flaggedCount && flaggedCount > 0) {
        score += 50;
        factors.push({
          type: 'flagged_address',
          severity: 'critical',
          description: 'Destination address has been flagged for suspicious activity',
          weight: 50,
        });
      }

      // Check if this is a new address for the user
      const { count: usedBefore } = await this.supabase
        .from('wallet_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', context.user_id)
        .eq('to_address', context.to_address)
        .eq('status', 'completed');

      if (!usedBefore || usedBefore === 0) {
        score += 10;
        factors.push({
          type: 'new_address',
          severity: 'medium',
          description: 'First time sending to this address',
          weight: 10,
        });
      }
    } catch (error) {
      console.error('Error analyzing address reputation:', error);
    }

    return score;
  }

  private async analyzeDevice(context: TransactionContext, factors: RiskFactor[]): Promise<number> {
    let score = 0;

    try {
      // Check for IP changes
      const { data: recentSessions } = await this.supabase
        .from('security_events')
        .select('ip_address')
        .eq('user_id', context.user_id)
        .eq('event_type', 'login_success')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentSessions && context.ip_address) {
        const knownIPs = new Set(recentSessions.map(s => s.ip_address));
        if (!knownIPs.has(context.ip_address)) {
          score += 15;
          factors.push({
            type: 'new_ip',
            severity: 'medium',
            description: 'Transaction from unfamiliar IP address',
            weight: 15,
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing device:', error);
    }

    return score;
  }

  private async analyzeAccount(context: TransactionContext, factors: RiskFactor[]): Promise<number> {
    let score = 0;

    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('created_at, verification_level, two_factor_enabled')
        .eq('id', context.user_id)
        .single();

      if (profile) {
        // Check account age
        const accountAge = Date.now() - new Date(profile.created_at).getTime();
        const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

        if (daysSinceCreation < 7) {
          score += 20;
          factors.push({
            type: 'new_account',
            severity: 'high',
            description: 'Account created less than 7 days ago',
            weight: 20,
          });
        }

        // Check verification level
        if (profile.verification_level < 2 && context.amount > 5000) {
          score += 15;
          factors.push({
            type: 'low_verification',
            severity: 'medium',
            description: 'Large transaction from low verification level account',
            weight: 15,
          });
        }

        // Check 2FA status
        if (!profile.two_factor_enabled && context.type === 'withdrawal') {
          score += 10;
          factors.push({
            type: 'no_2fa',
            severity: 'medium',
            description: 'Withdrawal without 2FA enabled',
            weight: 10,
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing account:', error);
    }

    return score;
  }

  private async detectFraudPatterns(context: TransactionContext, factors: RiskFactor[]): Promise<number> {
    let score = 0;

    try {
      // Pattern 1: Rapid deposit followed by withdrawal
      if (context.type === 'withdrawal') {
        const { data: recentDeposit } = await this.supabase
          .from('wallet_transactions')
          .select('created_at, amount')
          .eq('user_id', context.user_id)
          .eq('type', 'deposit')
          .eq('crypto_symbol', context.crypto_symbol)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (recentDeposit && Math.abs(recentDeposit.amount) > context.amount * 0.8) {
          score += 30;
          factors.push({
            type: 'rapid_turnover',
            severity: 'critical',
            description: 'Withdrawal shortly after deposit (potential money laundering)',
            weight: 30,
          });
        }
      }

      // Pattern 2: Multiple failed transactions before success
      const { count: failedCount } = await this.supabase
        .from('wallet_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', context.user_id)
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (failedCount && failedCount > 3) {
        score += 15;
        factors.push({
          type: 'multiple_failures',
          severity: 'medium',
          description: `${failedCount} failed transactions in last hour`,
          weight: 15,
        });
      }
    } catch (error) {
      console.error('Error detecting fraud patterns:', error);
    }

    return score;
  }

  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= this.CRITICAL_THRESHOLD) return 'critical';
    if (score >= this.HIGH_THRESHOLD) return 'high';
    if (score >= this.MEDIUM_THRESHOLD) return 'medium';
    return 'low';
  }

  private async logRiskAssessment(context: TransactionContext, riskScore: RiskScore): Promise<void> {
    try {
      await this.supabase
        .from('risk_assessments')
        .insert({
          user_id: context.user_id,
          transaction_type: context.type,
          crypto_symbol: context.crypto_symbol,
          amount: context.amount,
          risk_score: riskScore.score,
          risk_level: riskScore.level,
          risk_factors: riskScore.factors,
          blocked: riskScore.blocked,
          requires_review: riskScore.requiresReview,
          to_address: context.to_address,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging risk assessment:', error);
    }
  }
}

export const riskEngine = new RiskEngine();
