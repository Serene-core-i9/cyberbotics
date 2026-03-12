const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const validator  = require('validator');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');
const supabase   = require('../supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many reset requests. Please wait an hour.' },
});

function signToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });
    if (!validator.isEmail(email))
      return res.status(400).json({ message: 'Invalid email address.' });
    if (!validator.isLength(username, { min: 3, max: 20 }))
      return res.status(400).json({ message: 'Username must be 3-20 characters.' });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ message: 'Username: letters, numbers, underscores only.' });
    if (!validator.isLength(password, { min: 8 }))
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const { data: existingEmail } = await supabase
      .from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (existingEmail)
      return res.status(409).json({ message: 'An account with that email already exists.' });

    const { data: existingUsername } = await supabase
      .from('users').select('id').ilike('username', username).maybeSingle();
    if (existingUsername)
      return res.status(409).json({ message: 'That username is already taken.' });

    const password_hash = await bcrypt.hash(password, 12);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ username: username.trim(), email: email.toLowerCase().trim(), password_hash })
      .select('id, username, email, role, is_verified, created_at')
      .single();

    if (error) throw error;

    const token = signToken(newUser.id);
    return res.status(201).json({ message: 'Account created successfully.', token, user: safeUser(newUser) });

  } catch (err) {
    console.error('[SIGNUP ERROR]', err.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const { data: user } = await supabase
      .from('users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();

    const dummyHash = '$2a$12$invalidhashfortimingattackprevention000000000000000000';
    const hash      = user ? user.password_hash : dummyHash;
    const match     = await bcrypt.compare(password, hash);

    if (!user || !match)
      return res.status(401).json({ message: 'Invalid email or password.' });

    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    const token = signToken(user.id);
    return res.status(200).json({ message: 'Login successful.', token, user: safeUser(user) });

  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

router.post('/forgot-password', forgotLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !validator.isEmail(email))
      return res.status(400).json({ message: 'Valid email required.' });

    const { data: user } = await supabase
      .from('users').select('id, email, username').eq('email', email.toLowerCase().trim()).maybeSingle();

    if (!user)
      return res.status(200).json({ message: 'If that email exists, a reset link was sent.' });

    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase.from('reset_tokens').insert({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${rawToken}`;
    await sendResetEmail(user.email, user.username, resetUrl);

    return res.status(200).json({ message: 'If that email exists, a reset link was sent.' });

  } catch (err) {
    console.error('[FORGOT PASSWORD ERROR]', err.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ message: 'Token and new password are required.' });
    if (!validator.isLength(newPassword, { min: 8 }))
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data: resetEntry } = await supabase
      .from('reset_tokens')
      .select('*, users(id)')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!resetEntry)
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash: newHash, updated_at: new Date().toISOString() }).eq('id', resetEntry.user_id);
    await supabase.from('reset_tokens').update({ used: true }).eq('token_hash', tokenHash);

    return res.status(200).json({ message: 'Password updated successfully. Please log in.' });

  } catch (err) {
    console.error('[RESET PASSWORD ERROR]', err.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

async function sendResetEmail(to, username, resetUrl) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'CYBERBOTICS — Password Reset Request',
    html: `
      <div style="background:#020a06;color:#a8ffd2;font-family:monospace;padding:32px;max-width:480px;margin:0 auto;border:1px solid rgba(0,255,159,0.2)">
        <h2 style="color:#00ff9f;letter-spacing:3px;font-size:1rem">CYBERBOTICS</h2>
        <p style="color:#3a6b50;font-size:0.8rem;letter-spacing:2px">PASSWORD RESET REQUEST</p>
        <hr style="border-color:rgba(0,255,159,0.2);margin:20px 0">
        <p>Hey <strong style="color:#fff">${username}</strong>,</p>
        <p style="color:#3a6b50">Click the button below to reset your password. This link expires in <strong style="color:#ffcc00">1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#00ff9f;color:#020a06;text-decoration:none;font-weight:bold;letter-spacing:2px;font-size:0.8rem">RESET PASSWORD</a>
        <p style="color:#3a6b50;font-size:0.75rem">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = router;
