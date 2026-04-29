import { createClient } from "./supabase";

export interface TradeFeedback {
  id: string;
  trade_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: 'positive' | 'negative';
  comment: string | null;
  response: string | null;
  response_at: string | null;
  payment_method: string | null;
  crypto_symbol: string | null;
  fiat_currency: string | null;
  trade_amount: number | null;
  created_at: string;
  updated_at: string;
  from_user?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface SubmitFeedbackParams {
  tradeId: string;
  toUserId: string;
  rating: 'positive' | 'negative';
  comment: string;
  paymentMethod?: string;
  cryptoSymbol?: string;
  fiatCurrency?: string;
  tradeAmount?: number;
}

export interface UpdateFeedbackParams {
  feedbackId: string;
  rating?: 'positive' | 'negative';
  comment?: string;
}

export interface SubmitResponseParams {
  feedbackId: string;
  response: string;
}

export async function submitFeedback(params: SubmitFeedbackParams): Promise<{ success: boolean; feedback?: TradeFeedback; error?: string }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in to submit feedback" };
  }

  const existingFeedback = await supabase
    .from('trade_feedback')
    .select('id')
    .eq('trade_id', params.tradeId)
    .eq('from_user_id', user.id)
    .single();

  if (existingFeedback.data) {
    return { success: false, error: "You have already submitted feedback for this trade" };
  }

  const { data, error } = await supabase
    .from('trade_feedback')
    .insert({
      trade_id: params.tradeId,
      from_user_id: user.id,
      to_user_id: params.toUserId,
      rating: params.rating,
      comment: params.comment,
      payment_method: params.paymentMethod,
      crypto_symbol: params.cryptoSymbol,
      fiat_currency: params.fiatCurrency,
      trade_amount: params.tradeAmount,
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting feedback:", error);
    return { success: false, error: error.message };
  }

  return { success: true, feedback: data };
}

export async function updateFeedback(params: UpdateFeedbackParams): Promise<{ success: boolean; feedback?: TradeFeedback; error?: string }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in to update feedback" };
  }

  const existingFeedback = await supabase
    .from('trade_feedback')
    .select('*')
    .eq('id', params.feedbackId)
    .eq('from_user_id', user.id)
    .single();

  if (!existingFeedback.data) {
    return { success: false, error: "Feedback not found or you don't have permission to update it" };
  }

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (params.rating) updateData.rating = params.rating;
  if (params.comment !== undefined) updateData.comment = params.comment;

  const { data, error } = await supabase
    .from('trade_feedback')
    .update(updateData)
    .eq('id', params.feedbackId)
    .select()
    .single();

  if (error) {
    console.error("Error updating feedback:", error);
    return { success: false, error: error.message };
  }

  return { success: true, feedback: data };
}

export async function submitResponse(params: SubmitResponseParams): Promise<{ success: boolean; feedback?: TradeFeedback; error?: string }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in to submit a response" };
  }

  const existingFeedback = await supabase
    .from('trade_feedback')
    .select('*')
    .eq('id', params.feedbackId)
    .eq('to_user_id', user.id)
    .single();

  if (!existingFeedback.data) {
    return { success: false, error: "Feedback not found or you don't have permission to respond" };
  }

  const { data, error } = await supabase
    .from('trade_feedback')
    .update({
      response: params.response,
      response_at: new Date().toISOString(),
    })
    .eq('id', params.feedbackId)
    .select()
    .single();

  if (error) {
    console.error("Error submitting response:", error);
    return { success: false, error: error.message };
  }

  return { success: true, feedback: data };
}

export async function getTradeFeedback(tradeId: string): Promise<{ success: boolean; feedback?: TradeFeedback[]; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('trade_feedback')
    .select(`
      *,
      from_user:from_user_id (
        username,
        avatar_url
      )
    `)
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching feedback:", error);
    return { success: false, error: error.message };
  }

  return { success: true, feedback: data || [] };
}

export async function getUserFeedback(userId: string, options?: { limit?: number; offset?: number }): Promise<{ success: boolean; feedback?: TradeFeedback[]; error?: string }> {
  const supabase = createClient();

  let query = supabase
    .from('trade_feedback')
    .select(`
      *,
      from_user:from_user_id (
        username,
        avatar_url,
        country
      )
    `)
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user feedback:", error);
    return { success: false, error: error.message };
  }

  return { success: true, feedback: data || [] };
}

export async function getMyFeedbackForTrade(tradeId: string): Promise<{ success: boolean; feedback?: TradeFeedback | null; error?: string }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  const { data, error } = await supabase
    .from('trade_feedback')
    .select('*')
    .eq('trade_id', tradeId)
    .eq('from_user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching my feedback:", error);
    return { success: false, error: error.message };
  }

  return { success: true, feedback: data || null };
}

export async function getCounterpartyFeedbackForTrade(tradeId: string, counterpartyId?: string): Promise<{ success: boolean; feedback?: TradeFeedback | null; error?: string }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!counterpartyId) {
    return { success: true, feedback: null };
  }

  // Query for feedback FROM the counterparty (for this specific trade)
  // The counterparty's feedback is feedback they left, where from_user_id = counterpartyId
  const { data, error } = await supabase
    .from('trade_feedback')
    .select(`
      *,
      from_user:from_user_id (
        username,
        avatar_url
      )
    `)
    .eq('trade_id', tradeId)
    .eq('from_user_id', counterpartyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching counterparty feedback:", error);
    return { success: false, error: error.message };
  }

  return { success: true, feedback: data || null };
}
