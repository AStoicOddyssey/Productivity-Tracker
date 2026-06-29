import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  // GET /api/time-logs?date=2025-06-30
  // GET /api/time-logs?from=2025-06-01&to=2025-06-30
  if (req.method === 'GET') {
    const { date, from, to } = req.query;
    let query = supabase
      .from('time_logs')
      .select('*, tasks(id, title, billable, branch_id, branches(name, colour))')
      .eq('user_id', user.user_id)
      .order('slot_start', { ascending: true });

    if (date)       query = query.eq('log_date', date);
    else if (from && to) query = query.gte('log_date', from).lte('log_date', to);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — assign task to one or more slots
  // body: { task_id, log_date, slots: [{ slot_start, slot_end }], note? }
  if (req.method === 'POST') {
    const { task_id, log_date, slots, note } = req.body;
    if (!task_id || !log_date || !slots?.length)
      return res.status(400).json({ error: 'task_id, log_date and slots required' });

    const rows = slots.map(s => ({
      user_id:    user.user_id,
      task_id,
      log_date,
      slot_start: s.slot_start,
      slot_end:   s.slot_end,
      note:       note || null
    }));

    // upsert — replaces if same user+date+slot_start already exists
    const { data, error } = await supabase
      .from('time_logs')
      .upsert(rows, { onConflict: 'user_id,log_date,slot_start' })
      .select('*, tasks(id, title, billable, branch_id, branches(name, colour))');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // DELETE — remove specific slot
  // body: { log_date, slot_start }
  if (req.method === 'DELETE') {
    const { log_date, slot_start } = req.body;
    if (!log_date || !slot_start) return res.status(400).json({ error: 'log_date and slot_start required' });
    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('user_id', user.user_id)
      .eq('log_date', log_date)
      .eq('slot_start', slot_start);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
