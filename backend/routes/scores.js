const express    = require('express');
const supabase   = require('../supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { level, score, correct, total } = req.body;
  if (!['beginner', 'intermediate', 'advanced'].includes(level))
    return res.status(400).json({ message: 'Invalid level.' });

  const { error } = await supabase.from('quiz_scores').insert({
    user_id: req.user.id,
    level,
    score:   Number(score)   || 0,
    correct: Number(correct) || 0,
    total:   Number(total)   || 0,
  });

  if (error) return res.status(500).json({ message: 'Could not save score.' });
  return res.status(201).json({ message: 'Score saved.' });
});

router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('quiz_scores')
    .select('level, score, correct, total, played_at')
    .eq('user_id', req.user.id)
    .order('played_at', { ascending: false });

  if (error) return res.status(500).json({ message: 'Could not fetch scores.' });
  return res.status(200).json({ scores: data });
});

router.get('/top/:level', async (req, res) => {
  const { level } = req.params;
  if (!['beginner', 'intermediate', 'advanced'].includes(level))
    return res.status(400).json({ message: 'Invalid level.' });

  const { data, error } = await supabase
    .from('quiz_scores')
    .select('score, users(username)')
    .eq('level', level)
    .order('score', { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ message: 'Could not fetch leaderboard.' });
  return res.status(200).json({ leaderboard: data });
});

module.exports = router;
