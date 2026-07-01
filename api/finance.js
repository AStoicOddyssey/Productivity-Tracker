import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const { type } = req.query;

  // ── ITEMS (income/expense recurring) ─────────────────────
  if (type === 'items') {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('finance_items')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { type: itype, name, amount } = req.body;
      if (!name || !itype) return res.status(400).json({ error: 'name and type required' });
      const { data, error } = await supabase
        .from('finance_items')
        .insert({ user_id: user.user_id, type: itype, name, amount: amount || 0 })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    if (req.method === 'PATCH') {
      const { id, name, amount } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { data, error } = await supabase
        .from('finance_items')
        .update({ name, amount })
        .eq('id', id).eq('user_id', user.user_id)
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase
        .from('finance_items')
        .delete().eq('id', id).eq('user_id', user.user_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  // ── OVERRIDES (monthly one-off adjustments) ───────────────
  if (type === 'overrides') {
    if (req.method === 'GET') {
      const { month } = req.query;
      let query = supabase.from('finance_overrides').select('*').eq('user_id', user.user_id);
      if (month) query = query.eq('month', month);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { item_id, month, amount } = req.body;
      if (!item_id || !month) return res.status(400).json({ error: 'item_id and month required' });
      const { data, error } = await supabase
        .from('finance_overrides')
        .upsert({ user_id: user.user_id, item_id, month, amount }, { onConflict: 'user_id,item_id,month' })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase
        .from('finance_overrides')
        .delete().eq('id', id).eq('user_id', user.user_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  // ── BALANCE LOG ───────────────────────────────────────────
  if (type === 'balance') {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('balance_log')
        .select('*')
        .eq('user_id', user.user_id)
        .order('log_date', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { log_date, balance, note } = req.body;
      if (!log_date || balance == null) return res.status(400).json({ error: 'log_date and balance required' });
      const { data, error } = await supabase
        .from('balance_log')
        .insert({ user_id: user.user_id, log_date, balance, note: note || null })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase
        .from('balance_log')
        .delete().eq('id', id).eq('user_id', user.user_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  // ── BUDGET ────────────────────────────────────────────────
  if (type === 'budget') {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('finance_budget')
        .select('*')
        .eq('user_id', user.user_id)
        .single();
      if (error) return res.status(200).json({ monthly: 0 });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { monthly } = req.body;
      const { data, error } = await supabase
        .from('finance_budget')
        .upsert({ user_id: user.user_id, monthly }, { onConflict: 'user_id' })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
  }

  return res.status(405).end();
}
