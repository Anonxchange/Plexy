
import { amlScreening } from './aml-screening';
import { createClient } from '../supabase';

const supabase = createClient();

export interface AMLCheckResult {
  passed: boolean;
  riskScore: number;
  flags: string[];
  requiresManualReview: boolean;
}

export class AMLWorkflow {
  async runRegistrationCheck(
    userId: string,
    fullName: string,
    country: string
  ): Promise<AMLCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    // 1. Sanctions screening
    const sanctions = await amlScreening.screenUser(userId, fullName, country);
    if (sanctions.length > 0) {
      riskScore += 100; // Critical risk
      flags.push(`Sanctions match: ${sanctions.length} hits`);
      
      await amlScreening.logAMLEvent(
        userId,
        'sanctions_screening',
        'critical',
        { matches: sanctions }
      );
    }

    // 2. Check for restricted countries
    const restrictedCountries = ['CU', 'IR', 'KP', 'SY', 'RU', 'BY'];
    if (restrictedCountries.includes(country)) {
      riskScore += 80;
      flags.push(`Restricted country: ${country}`);
      
      await amlScreening.logAMLEvent(
        userId,
        'restricted_country',
        'high',
        { country }
      );
    }

    // 3. Check for duplicate accounts (same name)
    const { data: duplicates } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('full_name', fullName)
      .neq('id', userId);

    if (duplicates && duplicates.length > 0) {
      riskScore += 30;
      flags.push(`Possible duplicate account`);
    }

    return {
      passed: riskScore < 100,
      riskScore,
      flags,
      requiresManualReview: riskScore >= 50 && riskScore < 100
    };
  }

  async runLevel1Check(userId: string): Promise<AMLCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Re-run registration checks
    const registrationCheck = await this.runRegistrationCheck(
      userId,
      profile.full_name || '',
      profile.country || 'US'
    );

    riskScore += registrationCheck.riskScore;
    flags.push(...registrationCheck.flags);

    // Additional Level 1 checks
    const hasStructuredDeposits = await amlScreening.checkStructuredDeposits(userId);
    if (hasStructuredDeposits) {
      riskScore += 60;
      flags.push('Structured deposit pattern detected');
    }

    return {
      passed: riskScore < 100,
      riskScore,
      flags,
      requiresManualReview: riskScore >= 50 && riskScore < 100
    };
  }

  async runLevel2Check(userId: string): Promise<AMLCheckResult> {
    // Enhanced checks for Level 2
    const level1Check = await this.runLevel1Check(userId);
    
    // Add document verification checks here when implemented
    // Check liveness detection results
    
    return level1Check;
  }

  async runLevel3Check(userId: string): Promise<AMLCheckResult> {
    // Most comprehensive checks for Level 3
    const level2Check = await this.runLevel2Check(userId);
    
    // Add address verification checks
    // Enhanced due diligence
    
    return level2Check;
  }

  async runTransactionCheck(
    userId: string,
    amount: number,
    cryptoAddress?: string,
    cryptoSymbol?: string
  ): Promise<AMLCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    // 1. Check transaction amount patterns
    if (amount > 10000) {
      riskScore += 20;
      flags.push('Large transaction');
    }

    // 2. Screen crypto address if provided
    if (cryptoAddress && cryptoSymbol) {
      const chainAnalysis = await amlScreening.screenAddress(
        cryptoAddress,
        cryptoSymbol
      );

      if (chainAnalysis) {
        if (chainAnalysis.risk_category === 'severe') {
          riskScore += 100;
          flags.push(`High-risk crypto address: ${chainAnalysis.risk_category}`);
        } else if (chainAnalysis.risk_category === 'high') {
          riskScore += 60;
          flags.push(`Risky crypto address: ${chainAnalysis.risk_category}`);
        } else if (chainAnalysis.risk_category === 'medium') {
          riskScore += 30;
          flags.push(`Medium-risk crypto address`);
        }

        await amlScreening.logAMLEvent(
          userId,
          'crypto_address_screening',
          chainAnalysis.risk_category === 'severe' ? 'critical' : 'medium',
          { address: cryptoAddress, analysis: chainAnalysis }
        );
      }
    }

    // 3. Check for structured deposits
    const hasStructuredDeposits = await amlScreening.checkStructuredDeposits(userId);
    if (hasStructuredDeposits) {
      riskScore += 50;
      flags.push('Structured deposit pattern');
    }

    return {
      passed: riskScore < 100,
      riskScore,
      flags,
      requiresManualReview: riskScore >= 50 && riskScore < 100
    };
  }
}

export const amlWorkflow = new AMLWorkflow();
