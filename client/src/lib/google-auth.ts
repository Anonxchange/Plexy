import { getSupabase } from "@/lib/supabase";

export async function signInWithGoogle(): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/signin",
    },
  });

  if (error) {
    throw error;
  }
}