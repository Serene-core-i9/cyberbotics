const jwt      = require('jsonwebtoken');
const supabase = require('../supabase');

async function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided. Please log in.' });

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role, is_verified, created_at, last_login')
      .eq('id', payload.sub)
      .single();

    if (error || !user)
      return res.status(401).json({ message: 'Account not found.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden.' });
    next();
  };
}

module.exports = { requireAuth, requireRole };
