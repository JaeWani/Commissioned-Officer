import { createClient } from 'npm:@supabase/supabase-js@2';

export function getSupabaseAdmin() {
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>;
  const secretKey = secretKeys.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', secretKey);
}
