import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const { type } = req.query;

  // ── MISC ITEMS (/api/time-logs?type=misc) ────────────────
  if (type === 'misc') {
    if (req.method === 'GET') {
      const { date } = req.query;
      let query = supabase.from('misc_items').select('*')
        .eq('user_id', user.user_id).order('created_at', { ascending: true });
      if (date) query = query.eq('log_date', date);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { log_date, description } = req.body;
      if (!log_date || !description) return res.status(400).json({ error: 'log_date and description required' });
      const { data, error } = await supabase.from('misc_items')
        .insert({ user_id: user.user_id, log_date, description }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase.from('misc_items')
        .delete().eq('id', id).eq('user_id', user.user_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).end();
  }

  // ── TIME LOGS (default) ───────────────────────────────────
  if (req.method === 'GET') {
    const { date, from, to } = req.query;
    let query = supabase.from('time_logs')
      .select('*, tasks(id, title, billable, branch_id, branches(name, colour))')
      .eq('user_id', user.user_id)
      .order('slot_start', { ascending: true });
    if (date) query = query.eq('log_date', date);
    else if (from && to) query = query.gte('log_date', from).lte('log_date', to);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { task_id, log_date, slots, note } = req.body;
    if (!task_id || !log_date || !slots?.length)
      return res.status(400).json({ error: 'task_id, log_date and slots required' });
    const rows = slots.map(s => ({
      user_id: user.user_id, task_id, log_date,
      slot_start: s.slot_start, slot_end: s.slot_end, note: note || null
    }));
    const { data, error } = await supabase.from('time_logs')
      .upsert(rows, { onConflict: 'user_id,log_date,slot_start' })
      .select('*, tasks(id, title, billable, branch_id, branches(name, colour))');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'DELETE') {
    const { log_date, slot_start } = req.body;
    if (!log_date || !slot_start) return res.status(400).json({ error: 'log_date and slot_start required' });
    const { error } = await supabase.from('time_logs')
      .delete().eq('user_id', user.user_id)
      .eq('log_date', log_date).eq('slot_start', slot_start);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
