import { clearCookie } from './_auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  clearCookie(res);
  return res.status(200).json({ ok: true });
}
