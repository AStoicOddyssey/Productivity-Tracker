import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { branch_id, status } = req.query;
    let query = supabase
      .from('tasks')
      .select('*, branches(name, colour)')
      .eq('user_id', user.user_id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (branch_id) query = query.eq('branch_id', branch_id);
    if (status)    query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { title, description, branch_id, billable, due_at } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.user_id,
        title,
        description: description || null,
        branch_id:   branch_id || null,
        billable:    billable !== false,
        due_at:      due_at || null
      })
      .select('*, branches(name, colour)')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, title, description, branch_id, billable, due_at, status, sort_order } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });

    const updates = {};
    if (title       !== undefined) updates.title       = title;
    if (description !== undefined) updates.description = description;
    if (branch_id   !== undefined) updates.branch_id   = branch_id;
    if (billable    !== undefined) updates.billable     = billable;
    if (due_at      !== undefined) updates.due_at       = due_at;
    if (sort_order  !== undefined) updates.sort_order   = sort_order;
    if (status      !== undefined) {
      updates.status       = status;
      updates.completed_at = status === 'completed' ? new Date().toISOString() : null;
    }

    const { data, error } = await supabase
      .from('tasks')
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
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
