import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const user = requireAuth(req, res);
  if (!user) return;

  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates required' });

  // Raw time logs for the period
  const { data: logs, error: logsErr } = await supabase
    .from('time_logs')
    .select('task_id, tasks(title, billable, branch_id, branches(name, colour))')
    .eq('user_id', user.user_id)
    .gte('log_date', from)
    .lte('log_date', to);

  if (logsErr) return res.status(500).json({ error: logsErr.message });

  // Task counts
  const { data: taskCounts, error: taskErr } = await supabase
    .from('tasks')
    .select('status')
    .eq('user_id', user.user_id);

  if (taskErr) return res.status(500).json({ error: taskErr.message });

  // Profile for hourly rate
  const { data: profile } = await supabase
    .from('profiles')
    .select('hourly_rate')
    .eq('id', user.user_id)
    .single();

  const rate = profile?.hourly_rate ?? 133.33;

  // Aggregate
  const totalSlots    = logs.length;
  const billableSlots = logs.filter(l => l.tasks?.billable).length;

  const branchMap = {};
  for (const log of logs) {
    const t = log.tasks;
    if (!t) continue;
    const key = t.branch_id || '__none__';
    if (!branchMap[key]) {
      branchMap[key] = {
        branch_id:    t.branch_id,
        branch_name:  t.branches?.name  || 'Unassigned',
        branch_colour: t.branches?.colour || '#6e7681',
        slots:         0,
        billable_slots: 0
      };
    }
    branchMap[key].slots++;
    if (t.billable) branchMap[key].billable_slots++;
  }

  const branches = Object.values(branchMap).map(b => ({
    ...b,
    hours:          b.slots * 0.5,
    billable_hours: b.billable_slots * 0.5
  })).sort((a, b) => b.hours - a.hours);

  const statusCounts = { todo: 0, in_progress: 0, completed: 0 };
  for (const t of taskCounts) statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;

  return res.status(200).json({
    total_hours:    totalSlots * 0.5,
    billable_hours: billableSlots * 0.5,
    total_earned:   parseFloat((billableSlots * 0.5 * rate).toFixed(2)),
    hourly_rate:    rate,
    branches,
    task_counts:    statusCounts
  });
}
