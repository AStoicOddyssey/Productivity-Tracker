import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('archived', false)
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { name, colour, hourly_rate } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const { data, error } = await supabase
      .from('branches')
      .insert({
        user_id: user.user_id,
        name,
        colour: colour || '#58a6ff',
        hourly_rate: hourly_rate != null ? hourly_rate : 133.33
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, name, colour, archived, hourly_rate } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const updates = {};
    if (name        !== undefined) updates.name = name;
    if (colour      !== undefined) updates.colour = colour;
    if (archived     !== undefined) updates.archived = archived;
    if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate;
    const { data, error } = await supabase
      .from('branches')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.user_id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
