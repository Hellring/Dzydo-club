import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { createInvitation, findInvitationByToken, consumeInvitation } from '../services/invite';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Invite a user (superadmin or club admin)
router.post('/invite', authenticateJWT, authorizeRoles('SUPERADMIN', 'ADMIN'), async (req, res) => {
  const { email, role } = req.body as { email: string; role: string };
  if (!email || !role) return res.status(400).json({ error: 'email and role required' });
  try {
    const inviter = (req as any).user;
    const inv = await createInvitation(email, role, inviter?.id);
    // In prod we would send email. For now return token for dev/testing
    res.status(201).json({ token: inv.token, expiresAt: inv.expiresAt });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Accept invitation: token + password + name
router.post('/accept', async (req, res) => {
  const { token, password, name } = req.body as { token?: string; password?: string; name?: string };
  if (!token || !password) return res.status(400).json({ error: 'token and password required' });
  try {
    const invite: any = await findInvitationByToken(token);
    if (!invite) return res.status(404).json({ error: 'invitation not found or expired' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email: invite.email, password: hashed, name: name || null, role: invite.role } as any });
    // consume token
    await consumeInvitation(token);
    res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// List users (public users table) - ADMIN/SUPERADMIN only
router.get('/', authenticateJWT, authorizeRoles('SUPERADMIN', 'ADMIN'), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    res.json(users);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
