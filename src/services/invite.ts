import prisma from '../prisma';
import crypto from 'crypto';

export async function createInvitation(email: string, role: string, invitedBy?: number) {
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  // Insert into public invitations table
  await prisma.$executeRawUnsafe(
    `INSERT INTO invitations (email, role, token, expires_at, invited_by) VALUES ($1, $2, $3, $4, $5)`,
    email,
    role,
    token,
    expiresAt,
    invitedBy || null
  );
  return { token, expiresAt };
}

export async function findInvitationByToken(token: string) {
  const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM invitations WHERE token = $1`, token);
  return rows && rows[0];
}

export async function consumeInvitation(token: string) {
  await prisma.$executeRawUnsafe(`DELETE FROM invitations WHERE token = $1`, token);
}
