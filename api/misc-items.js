import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { date } = req.query;
    let query = supabase
      .from('misc_items')
      .select('*')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: true });
    if (date) query = query.eq('log_date', date);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { log_date, description } = req.body;
    if (!log_date || !description) return res.status(400).json({ error: 'log_date and description required' });
    const { data, error } = await supabase
      .from('misc_items')
      .insert({ user_id: user.user_id, log_date, description })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const { error } = await supabase
      .from('misc_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
