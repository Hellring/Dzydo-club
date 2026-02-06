import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { createTenantSchema } from '../src/tenant';

describe('tenant isolation', () => {
  let clubA: any;
  let clubB: any;
  let schemaA: string;
  let schemaB: string;

  beforeAll(async () => {
    clubA = await prisma.club.create({ data: { name: 'Club A', slug: 'club-a' } });
    clubB = await prisma.club.create({ data: { name: 'Club B', slug: 'club-b' } });
    schemaA = `club_${clubA.id}`;
    schemaB = `club_${clubB.id}`;
    await createTenantSchema(schemaA);
    await createTenantSchema(schemaB);

    // insert athlete into schemaA
    await prisma.$executeRawUnsafe(`INSERT INTO "${schemaA}".athletes (first_name, last_name) VALUES ($1, $2)`, 'A1', 'A1');
    // insert athlete into schemaB
    await prisma.$executeRawUnsafe(`INSERT INTO "${schemaB}".athletes (first_name, last_name) VALUES ($1, $2)`, 'B1', 'B1');
  });

  afterAll(async () => {
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaA}" CASCADE`);
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaB}" CASCADE`);
      await prisma.club.deleteMany({ where: { id: { in: [clubA.id, clubB.id] } } });
    } catch (e) {}
    await prisma.$disconnect();
  });

  test('schemas are isolated', async () => {
    const rowsA: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schemaA}".athletes`);
    const rowsB: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schemaB}".athletes`);
    expect(rowsA.length).toBe(1);
    expect(rowsB.length).toBe(1);
    expect(rowsA[0].first_name).toBe('A1');
    expect(rowsB[0].first_name).toBe('B1');
  });
});
