import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const { type } = req.query;

  // ── MODULES ───────────────────────────────────────────────
  if (type === 'modules') {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('uni_modules')
        .select('*')
        .eq('user_id', user.user_id)
        .order('name', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { name, colour } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      const { data, error } = await supabase
        .from('uni_modules')
        .insert({ user_id: user.user_id, name, colour: colour || '#58a6ff' })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    if (req.method === 'PATCH') {
      const { id, name, colour } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { data, error } = await supabase
        .from('uni_modules')
        .update({ name, colour })
        .eq('id', id).eq('user_id', user.user_id)
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase
        .from('uni_modules')
        .delete().eq('id', id).eq('user_id', user.user_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  // ── TASKS ─────────────────────────────────────────────────
  if (type === 'tasks') {
    if (req.method === 'GET') {
      const { from, to } = req.query;
      let query = supabase
        .from('uni_tasks')
        .select('*, uni_modules(id, name, colour)')
        .eq('user_id', user.user_id)
        .order('due_date', { ascending: true });
      if (from && to) query = query.gte('due_date', from).lte('due_date', to);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { module_id, description, due_date, status } = req.body;
      if (!description || !due_date) return res.status(400).json({ error: 'description and due_date required' });
      const { data, error } = await supabase
        .from('uni_tasks')
        .insert({
          user_id: user.user_id,
          module_id: module_id || null,
          description,
          due_date,
          status: status || 'todo'
        })
        .select('*, uni_modules(id, name, colour)')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    if (req.method === 'PATCH') {
      const { id, module_id, description, due_date, status } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const updates = {};
      if (module_id   !== undefined) updates.module_id   = module_id;
      if (description !== undefined) updates.description = description;
      if (due_date    !== undefined) updates.due_date    = due_date;
      if (status      !== undefined) updates.status      = status;
      const { data, error } = await supabase
        .from('uni_tasks')
        .update(updates)
        .eq('id', id).eq('user_id', user.user_id)
        .select('*, uni_modules(id, name, colour)')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase
        .from('uni_tasks')
        .delete().eq('id', id).eq('user_id', user.user_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  // ── PERIODS (background ranges: recess, exams, etc.) ──────
  if (type === 'periods') {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('uni_periods')
        .select('*')
        .eq('user_id', user.user_id)
        .order('start_date', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { label, colour, start_date, end_date } = req.body;
      if (!label || !start_date || !end_date) return res.status(400).json({ error: 'label, start_date and end_date required' });
      const { data, error } = await supabase
        .from('uni_periods')
        .insert({ user_id: user.user_id, label, colour: colour || '#8957e5', start_date, end_date })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    if (req.method === 'PATCH') {
      const { id, label, colour, start_date, end_date } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const updates = {};
      if (label      !== undefined) updates.label      = label;
      if (colour     !== undefined) updates.colour     = colour;
      if (start_date !== undefined) updates.start_date = start_date;
      if (end_date   !== undefined) updates.end_date   = end_date;
      const { data, error } = await supabase
        .from('uni_periods')
        .update(updates)
        .eq('id', id).eq('user_id', user.user_id)
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase
        .from('uni_periods')
        .delete().eq('id', id).eq('user_id', user.user_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(405).end();
}
