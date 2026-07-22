import { handler as branches }  from './_h_branches.js';
import { handler as tasks }     from './_h_tasks.js';
import { handler as timeLogs }  from './_h_time_logs.js';
import { handler as summary }   from './_h_summary.js';
import { handler as notes }     from './_h_notes.js';

export default async function handler(req, res) {
  const resource = (req.query.resource || '').toString();
  switch (resource) {
    case 'branches':  return branches(req, res);
    case 'tasks':     return tasks(req, res);
    case 'time-logs': return timeLogs(req, res);
    case 'summary':   return summary(req, res);
    case 'notes':     return notes(req, res);
    default:          return res.status(404).json({ error: 'Unknown resource' });
  }
}
