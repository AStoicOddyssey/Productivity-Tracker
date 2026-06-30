import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('bank_details')
      .select('*')
      .eq('user_id', user.user_id)
      .single();
    if (error) return res.status(200).json({});
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { bank_name, branch_code, account_number, account_type, account_holder } = req.body;
    const { data, error } = await supabase
      .from('bank_details')
      .upsert({
        user_id: user.user_id,
        bank_name, branch_code, account_number, account_type, account_holder
      }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
