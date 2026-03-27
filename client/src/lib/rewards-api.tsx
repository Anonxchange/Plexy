import { getSupabase } from "./supabase";

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = await getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  };
}

function edgeUrl(fn: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`;
}

async function callEdge<T>(fn: string, method: "GET" | "POST" = "GET", body?: object): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(edgeUrl(fn), {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json as T;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface RewardsProfile {
  balance: number;
  lifetimeEarned: number;
  currentStreak: number;
  longestStreak: number;
  weeklyPts: number;
  rank: number;
  lastLoginDate: string | null;
}

export function fetchRewardsProfile(): Promise<RewardsProfile> {
  return callEdge<RewardsProfile>("rewards-profile");
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export interface TaskCompletions {
  daily: string[];     // task IDs completed today
  permanent: string[]; // task IDs completed ever (one-time / milestone)
}

export function fetchTaskCompletions(): Promise<TaskCompletions> {
  return callEdge<TaskCompletions>("rewards-tasks");
}

// ─── Complete a task ──────────────────────────────────────────────────────────

export interface TaskCompleteResult {
  success?: boolean;
  already_completed?: boolean;
  pts_earned?: number;
  new_balance?: number;
}

export function completeTask(task_id: string): Promise<TaskCompleteResult> {
  return callEdge<TaskCompleteResult>("rewards-task-complete", "POST", { task_id });
}

// ─── Daily login ──────────────────────────────────────────────────────────────

export interface DailyLoginResult {
  success?: boolean;
  already_claimed?: boolean;
  pts_earned?: number;
  new_streak?: number;
  new_balance?: number;
  current_streak?: number;
}

export function claimDailyLogin(): Promise<DailyLoginResult> {
  return callEdge<DailyLoginResult>("rewards-daily-login", "POST");
}

// ─── Redeem reward ────────────────────────────────────────────────────────────

export interface RedeemResult {
  success?: boolean;
  pts_spent?: number;
  new_balance?: number;
  error?: string;
  required?: number;
  current?: number;
  shortfall?: number;
}

export function redeemReward(reward_id: string): Promise<RedeemResult> {
  return callEdge<RedeemResult>("rewards-redeem", "POST", { reward_id });
}

// ─── Apply promo code ─────────────────────────────────────────────────────────

export interface PromoResult {
  success?: boolean;
  pts_earned?: number;
  new_balance?: number;
  error?: string;
}

export function applyPromoCode(code: string): Promise<PromoResult> {
  return callEdge<PromoResult>("rewards-promo", "POST", { code });
}
