import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchRewardsProfile,
  fetchTaskCompletions,
  completeTask,
  claimDailyLogin,
  redeemReward,
  applyPromoCode,
  type RewardsProfile,
  type TaskCompletions,
} from "@/lib/rewards-api";
import { mapRewardsProfile } from "@/lib/mappers/user";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const REWARDS_KEYS = {
  profile:     ["rewards", "profile"]     as const,
  completions: ["rewards", "completions"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useRewardsProfile() {
  return useQuery<RewardsProfile>({
    queryKey: REWARDS_KEYS.profile,
    queryFn:  fetchRewardsProfile,
    staleTime: 30_000,
    select: (data) => mapRewardsProfile(data),
  });
}

export function useTaskCompletions() {
  return useQuery<TaskCompletions>({
    queryKey: REWARDS_KEYS.completions,
    queryFn:  fetchTaskCompletions,
    staleTime: 30_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task_id: string) => completeTask(task_id),
    onSuccess: (data) => {
      if (data.already_completed) {
        toast.info("Already completed!");
        return;
      }
      toast.success(`+${data.pts_earned} pts earned!`);
      qc.invalidateQueries({ queryKey: REWARDS_KEYS.profile });
      qc.invalidateQueries({ queryKey: REWARDS_KEYS.completions });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useClaimDailyLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: claimDailyLogin,
    onSuccess: (data) => {
      if (data.already_claimed) return;
      toast.success(`Daily login claimed! +${data.pts_earned} pts · ${data.new_streak}-day streak 🔥`);
      qc.invalidateQueries({ queryKey: REWARDS_KEYS.profile });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reward_id: string) => redeemReward(reward_id),
    onSuccess: (data) => {
      if (data.error) {
        if (data.shortfall) {
          toast.error(`Need ${data.shortfall.toLocaleString()} more points`);
        } else {
          toast.error(data.error);
        }
        return;
      }
      toast.success("Redemption submitted! We'll process it shortly.");
      qc.invalidateQueries({ queryKey: REWARDS_KEYS.profile });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useApplyPromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => applyPromoCode(code),
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success(`Promo applied! +${data.pts_earned} pts added to your balance 🎉`);
      qc.invalidateQueries({ queryKey: REWARDS_KEYS.profile });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
