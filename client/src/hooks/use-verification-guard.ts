import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { 
  canTrade, 
  canCreateOffer, 
  getVerificationLevel,
  getVerificationRequirements 
} from "@shared/verification-levels";

export function useVerificationGuard() {
  const { user } = useAuth();
  const supabase = createClient();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const verificationLevel = Number(userProfile?.verification_level) || 0;
  const levelConfig = getVerificationLevel(verificationLevel);
  const lifetimeTradeVolume = Number(userProfile?.lifetime_trade_volume) || 0;
  const lifetimeSendVolume = Number(userProfile?.lifetime_send_volume) || 0;

  const checkCanTrade = (amount: number) => {
    return canTrade(verificationLevel, amount, lifetimeTradeVolume);
  };

  const checkCanCreateOffer = () => {
    return canCreateOffer(verificationLevel);
  };

  const getNextLevelInfo = () => {
    return getVerificationRequirements(verificationLevel);
  };

  return {
    isLoading,
    verificationLevel,
    levelConfig,
    lifetimeTradeVolume,
    lifetimeSendVolume,
    userProfile,
    checkCanTrade,
    checkCanCreateOffer,
    getNextLevelInfo,
    isLevel0: verificationLevel === 0,
    isLevel1: verificationLevel === 1,
    isLevel2: verificationLevel === 2,
    isLevel3: verificationLevel === 3,
  };
}
