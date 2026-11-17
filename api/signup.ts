// Makes a grown-up account. The free Supabase plan only emails people on the project team,
// so instead of a confirmation email we create the account already confirmed, here on the server.
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, which the Supabase integration sets in Vercel.

import { createClient } from '@supabase/supabase-js';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function POST(request: Request): Promise<Response> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return json({ error: 'Accounts are not switched on yet.' }, 503);

  let email = '';
  let password = '';
  let name = '';
  let role = 'parent';
  try {
    const body = (await request.json()) as Record<string, unknown>;
    email = String(body.email ?? '').trim().toLowerCase();
    password = String(body.password ?? '');
    name = String(body.name ?? '').trim().slice(0, 60);
    role = body.role === 'teacher' ? 'teacher' : 'parent';
  } catch {
    return json({ error: 'Something went wrong. Please try again.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return json({ error: 'Please check the email address.' }, 400);
  if (password.length < 8 || password.length > 200) return json({ error: 'The password needs at least 8 characters.' }, 400);
  if (!name) return json({ error: 'Please add your name.' }, 400);

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error || !data.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? '');
    return json({ error: taken ? 'There is already an account with this email. Try signing in.' : 'Could not make the account. Please try again.' }, taken ? 409 : 500);
  }
  const { error: pErr } = await admin.from('profiles').upsert({ id: data.user.id, name, role });
  if (pErr) console.warn('profile not saved', pErr.message);
  return json({ ok: true });
}
