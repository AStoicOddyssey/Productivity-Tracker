import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!user.is_admin) return res.status(403).json({ error: 'Admin only' });

  // GET — list all users
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, hourly_rate, created_at')
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — invite new user
  if (req.method === 'POST') {
    const { email, full_name, hourly_rate } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name || '' }
    });
    if (error) return res.status(500).json({ error: error.message });

    // Set hourly rate if provided
    if (hourly_rate && data.user) {
      await supabase
        .from('profiles')
        .update({ hourly_rate, full_name })
        .eq('id', data.user.id);
    }

    return res.status(201).json({ ok: true });
  }

  // PATCH — update a user's rate or admin status
  if (req.method === 'PATCH') {
    const { id, hourly_rate, is_admin } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const updates = {};
    if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate;
    if (is_admin    !== undefined) updates.is_admin    = is_admin;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
