import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import bcrypt from 'bcryptjs';

describe('users invite flow', () => {
  let superadminToken: string;

  beforeAll(async () => {
    // create a superadmin user
    const hashed = await bcrypt.hash('superpass', 10);
    const u: any = await prisma.user.create({ data: { email: 'sa@example.test', password: hashed, name: 'SA', role: 'SUPERADMIN' } as any });

    // login to obtain token
    const res = await request(app).post('/auth/login').send({ email: 'sa@example.test', password: 'superpass' });
    expect(res.status).toBe(200);
    superadminToken = res.body.access;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: {} });
    await prisma.user.deleteMany({ where: { email: { contains: '@example.test' } } });
    await prisma.$disconnect();
  });

  test('invite and accept', async () => {
    const inviteRes = await request(app)
      .post('/users/invite')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ email: 'newuser@example.test', role: 'PARENT' });

    expect(inviteRes.status).toBe(201);
    const { token } = inviteRes.body;
    expect(token).toBeDefined();

    // accept invitation
    const accept = await request(app).post('/users/accept').send({ token, password: 'userpass', name: 'New User' });
    expect(accept.status).toBe(201);
    expect(accept.body.user.email).toBe('newuser@example.test');
  });
});
