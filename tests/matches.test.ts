import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { createTenantSchema } from '../src/tenant';

describe('matches flow', () => {
  let clubId: number;
  let schemaName: string;
  let athleteIds: number[] = [];
  let tournamentId: number;

  beforeAll(async () => {
    // Requires DATABASE_URL or TEST_DATABASE_URL configured
    // create club record
    const club = await prisma.club.create({ data: { name: 'Test Club', slug: 'test-club' } });
    clubId = club.id;
    schemaName = `club_${clubId}`;
    await createTenantSchema(schemaName);

    // insert athletes into tenant schema
    const inserted: any = await prisma.$queryRawUnsafe(
      `INSERT INTO "${schemaName}".athletes (first_name, last_name) VALUES ($1, $2), ($3, $4), ($5, $6) RETURNING id`,
      'Ivan',
      'Ivanov',
      'Petr',
      'Petrov',
      'Sergey',
      'Sergeev'
    );

    athleteIds = (inserted as any[]).map((r: any) => r.id);

    // create tournament
    const t: any = await prisma.$queryRawUnsafe(
      `INSERT INTO "${schemaName}".tournaments (name) VALUES ($1) RETURNING id`,
      'Test Tournament'
    );
    tournamentId = t[0].id;
  });

  afterAll(async () => {
    // cleanup: drop schema and club
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await prisma.club.deleteMany({ where: { id: clubId } });
    } catch (e) {
      // ignore
    }
    await prisma.$disconnect();
  });

  test('generate bracket and promote winner', async () => {
    // generate bracket
    const genRes = await request(app)
      .post(`/matches/generate/${tournamentId}`)
      .set('X-Club-Id', String(clubId))
      .send({ participants: athleteIds });

    expect(genRes.status).toBe(201);
    expect(genRes.body).toHaveProperty('created');

    // fetch first round matches
    const list = await request(app).get(`/matches/tournament/${tournamentId}`).set('X-Club-Id', String(clubId));
    expect(list.status).toBe(200);
    const matches = list.body;
    expect(matches.length).toBeGreaterThan(0);

    const firstMatch = matches[0];
    // pick a winner from athlete_a if present, otherwise athlete_b
    const winner = firstMatch.athlete_a || firstMatch.athlete_b;
    expect(winner).toBeDefined();

    // submit result
    const res = await request(app)
      .post(`/matches/${firstMatch.id}/result`)
      .set('X-Club-Id', String(clubId))
      .send({ winner, result: { method: 'ippon' } });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    // check next round match has promoted athlete
    const nextList = await request(app).get(`/matches/tournament/${tournamentId}`).set('X-Club-Id', String(clubId));
    const nextMatches = nextList.body;
    const nextRound = nextMatches.find((m: any) => m.round === 2);
    expect(nextRound).toBeDefined();
    const promoted = nextRound.athlete_a || nextRound.athlete_b;
    expect(promoted).toBe(winner);
  });
});
