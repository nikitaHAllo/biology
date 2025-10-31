import express from 'express';

const router = express.Router();

router.get('/config', (req, res) => {
  const price = Number(process.env.ASSIGNMENT_PRICE || 10);
  res.json({ assignmentPrice: price });
});

router.get('/bot', (req, res) => {
  // simple readiness flag based on env presence
  res.json({ bot: !!process.env.BOT_TOKEN ? 'ok' : 'not_configured' });
});

export const metaRouter = router;
