import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('user_id', user.user_id)
      .single();
    // Return defaults if not yet set
    if (error) return res.status(200).json({ enabled: true, reminder_time: '18:00' });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { enabled, reminder_time } = req.body;
    const { data, error } = await supabase
      .from('reminder_settings')
      .upsert({ user_id: user.user_id, enabled, reminder_time }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
