import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Store } from "@/lib/types";

export async function requireProfile(): Promise<{ profile: Profile; store: Store }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("id", profile.store_id)
    .maybeSingle();

  if (!store) redirect("/onboarding");
  return { profile: profile as Profile, store: store as Store };
}
