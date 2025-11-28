
import { createClient } from '../supabase';

const supabase = createClient();

export interface SanctionsMatch {
  list_name: string;
  entity_name: string;
  entity_type: string;
  country: string;
  match_score: number;
}

export interface ChainAnalysisResult {
  address: string;
  crypto_symbol: string;
  risk_score: number;
  risk_category: 'low' | 'medium' | 'high' | 'severe';
  exposure_to: string[];
  analyzed_at: string;
}

class AMLScreening {
  async screenUser(userId: string, fullName: string, country: string): Promise<SanctionsMatch[]> {
    const { data: sanctions, error } = await supabase
      .from('sanctions_lists')
      .select('*')
      .or(`country.eq.${country},country.is.null`);

    if (error) throw error;

    const matches: SanctionsMatch[] = [];
    const nameLower = fullName.toLowerCase();

    for (const sanction of sanctions || []) {
      const entityLower = sanction.entity_name.toLowerCase();
      const similarity = this.calculateSimilarity(nameLower, entityLower);

      if (similarity > 0.8) {
        matches.push({
          list_name: sanction.list_name,
          entity_name: sanction.entity_name,
          entity_type: sanction.entity_type,
          country: sanction.country,
          match_score: similarity,
        });
      }
    }

    return matches;
  }

  async screenAddress(
    address: string,
    crypto_symbol: string
  ): Promise<ChainAnalysisResult | null> {
    const { data, error } = await supabase
      .from('chain_analysis')
      .select('*')
      .eq('address', address)
      .eq('crypto_symbol', crypto_symbol)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async checkStructuredDeposits(userId: string): Promise<boolean> {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const { data: deposits, error } = await supabase
      .from('wallet_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .eq('type', 'deposit')
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!deposits || deposits.length < 3) return false;

    // Check for structured deposits (multiple deposits just under reporting threshold)
    const THRESHOLD = 10000;
    const structuredPattern = deposits.filter(
      (d) => d.amount > THRESHOLD * 0.8 && d.amount < THRESHOLD
    );

    return structuredPattern.length >= 3;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private getEditDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

export const amlScreening = new AMLScreening();
