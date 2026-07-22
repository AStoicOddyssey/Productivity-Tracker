import { handler as finance }    from './_h_finance.js';
import { handler as settings }   from './_h_settings.js';
import { handler as timetables } from './_h_timetables.js';
import { handler as uni }        from './_h_uni.js';

export default async function handler(req, res) {
  const resource = (req.query.resource || '').toString();
  switch (resource) {
    case 'finance':    return finance(req, res);
    case 'settings':   return settings(req, res);
    case 'timetables': return timetables(req, res);
    case 'uni':        return uni(req, res);
    default:           return res.status(404).json({ error: 'Unknown resource' });
  }
}
