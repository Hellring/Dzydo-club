import { Router } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: 'email/password required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const access = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET || 'secret', { expiresIn: '30d' });

  // store refresh token
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

  res.json({ access, refresh: refreshToken });
});

router.post('/refresh', async (req, res) => {
  const { refresh } = req.body as { refresh?: string };
  if (!refresh) return res.status(400).json({ error: 'refresh token required' });

  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET || 'secret') as any;
    const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: refresh } });
    if (!tokenRecord) return res.status(401).json({ error: 'invalid refresh token' });
    const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });
    if (!user) return res.status(401).json({ error: 'user not found' });

    const access = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '15m' });
    res.json({ access });
  } catch (e) {
    return res.status(401).json({ error: 'invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const { refresh } = req.body as { refresh?: string };
  if (!refresh) return res.status(400).json({ error: 'refresh token required' });
  try {
    await prisma.refreshToken.deleteMany({ where: { token: refresh } });
    return res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'failed to logout' });
  }
});

export default router;
