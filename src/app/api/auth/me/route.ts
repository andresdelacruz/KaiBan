import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  // Read email from Cloudflare Access header
  const email =
    req.headers.get("cf-access-authenticated-user-email") ??
    req.headers.get("x-user-email"); // fallback for local dev

  if (!email) {
    return NextResponse.json(
      { user: null, error: "No authenticated user" },
      { status: 401 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Upsert user by email
  const { data, error } = await supabase
    .from("users")
    .upsert({ email, name: email.split("@")[0] }, { onConflict: "email" })
    .select("id, email, name, avatar_url")
    .single();

  if (error) {
    return NextResponse.json({ user: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatar_url,
    },
  });
}
