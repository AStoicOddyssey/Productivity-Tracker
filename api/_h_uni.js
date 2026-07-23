import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

// Shared uni space: modules + periods are always global.
// Tasks are global by default; a 'personal' task is only visible to its creator.
// Status is tracked per person via uni_task_status (person_key), not on the task row.

export async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const { type } = req.query;

  // ── MODULES (always global) ───────────────────────────────
  if (type === 'modules') {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('uni_modules')
        .select('*')
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
        .eq('id', id)
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase.from('uni_modules').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  // ── TASKS (global, or personal to creator) ────────────────
  if (type === 'tasks') {
    if (req.method === 'GET') {
      const { from, to } = req.query;
      let query = supabase
        .from('uni_tasks')
        .select('*, uni_modules(id, name, colour), uni_task_status(person_key, status)')
        .or('visibility.eq.global,user_id.eq.' + user.user_id)
        .order('due_date', { ascending: true });
      if (from && to) query = query.gte('due_date', from).lte('due_date', to);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { module_id, description, due_date, visibility } = req.body;
      if (!description || !due_date) return res.status(400).json({ error: 'description and due_date required' });
      const { data, error } = await supabase
        .from('uni_tasks')
        .insert({
          user_id: user.user_id,
          module_id: module_id || null,
          description,
          due_date,
          visibility: visibility === 'personal' ? 'personal' : 'global'
        })
        .select('*, uni_modules(id, name, colour), uni_task_status(person_key, status)')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    if (req.method === 'PATCH') {
      const { id, module_id, description, due_date, visibility } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const updates = {};
      if (module_id   !== undefined) updates.module_id   = module_id;
      if (description !== undefined) updates.description = description;
      if (due_date    !== undefined) updates.due_date    = due_date;
      if (visibility  !== undefined) updates.visibility  = visibility === 'personal' ? 'personal' : 'global';
      const { data, error } = await supabase
        .from('uni_tasks')
        .update(updates)
        .eq('id', id)
        .select('*, uni_modules(id, name, colour), uni_task_status(person_key, status)')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase.from('uni_tasks').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  // ── PER-PERSON STATUS ─────────────────────────────────────
  if (type === 'status') {
    if (req.method === 'POST') {
      const { task_id, person_key, status } = req.body;
      if (!task_id || !person_key) return res.status(400).json({ error: 'task_id and person_key required' });
      if (!['todo', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const { data, error } = await supabase
        .from('uni_task_status')
        .upsert(
          { task_id, person_key, status, updated_at: new Date().toISOString() },
          { onConflict: 'task_id,person_key' }
        )
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
  }

  // ── PERIODS (always global) ───────────────────────────────
  if (type === 'periods') {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('uni_periods')
        .select('*')
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
        .eq('id', id)
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase.from('uni_periods').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(405).end();
}
