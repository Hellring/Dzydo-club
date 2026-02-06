import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = process.env.SUPERADMIN_EMAIL || 'admin@dzydo.local';
  const password = process.env.SUPERADMIN_PASSWORD || 'changeme';

  const hashed = await bcrypt.hash(password, 10);

  // create or find default club record (idempotent)
  let club = await prisma.club.findUnique({ where: { slug: 'default' } });
  if (!club) {
    club = await prisma.club.create({ data: { name: 'Default Club', slug: 'default' } });
    console.log('Created default club');
  } else {
    console.log('Default club already exists');
  }

  // create superadmin user in public users table (idempotent)
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({ data: { email, password: hashed, name: 'Super Admin', role: 'SUPERADMIN' } as any });
    console.log('Created superadmin:', email);
  } else {
    console.log('Superadmin already exists:', email);
  }

  // Create club-specific schema for tenant isolation
  const schemaName = `club_${club.id}`;
  try {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    // initialize tenant tables from template
    const { readFile } = await import('fs/promises');
    const path = require('path');
    const sqlPath = path.join(__dirname, '..', 'prisma', 'tenant_schema.sql');
    const template = await readFile(sqlPath, 'utf-8');
    await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}", public;\n${template}`);
    console.log('Initialized tenant schema:', schemaName);
  } catch (e: any) {
    console.log('Tenant schema already initialized or exists:', schemaName);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
