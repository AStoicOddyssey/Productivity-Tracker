import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { id } = req.query;
    if (id) {
      const { data, error } = await supabase
        .from('notes')
        .select('*, branches(name, colour)')
        .eq('id', id)
        .eq('user_id', user.user_id)
        .single();
      if (error) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(data);
    }
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, branch_id, branches(name, colour), updated_at')
      .eq('user_id', user.user_id)
      .order('updated_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { title, body, branch_id } = req.body;
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id:   user.user_id,
        title:     title || 'Untitled note',
        body:      body || '',
        branch_id: branch_id || null
      })
      .select('*, branches(name, colour)')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, title, body, branch_id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const updates = {};
    if (title     !== undefined) updates.title     = title;
    if (body      !== undefined) updates.body      = body;
    if (branch_id !== undefined) updates.branch_id = branch_id;

    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.user_id)
      .select('*, branches(name, colour)')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
