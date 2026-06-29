import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export function requireAuth(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.pt_token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorised' });
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload; // { user_id, email, is_admin }
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

export function setCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize('pt_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  }));
}

export function clearCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize('pt_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  }));
}
