import jwt from 'jsonwebtoken';
import { supabase } from './_supabase.js';
import { setCookie } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Invalid credentials' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, full_name')
    .eq('id', data.user.id)
    .single();

  const token = jwt.sign(
    { user_id: data.user.id, email: data.user.email, is_admin: profile?.is_admin ?? false },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  setCookie(res, token);
  return res.status(200).json({ ok: true, is_admin: profile?.is_admin ?? false });
}
