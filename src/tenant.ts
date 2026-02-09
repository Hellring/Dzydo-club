import { Request, Response, NextFunction } from 'express';
import prisma from './prisma';
import fs from 'fs/promises';
import path from 'path';

export async function createTenantSchema(schemaName: string) {
  // create schema and initialize tables from template
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  const sqlPath = path.join(__dirname, '..', 'prisma', 'tenant_schema.sql');
  const template = await fs.readFile(sqlPath, 'utf-8');
  // Set search_path to the schema, then execute template
  await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`);
  
  // Split template into individual statements and execute each one
  // Filter out empty lines and comments at statement level
  const statements = template
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  for (const statement of statements) {
    if (statement.trim().length > 0) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (e) {
        console.error(`Failed to execute statement: ${statement.substring(0, 50)}...`, e);
        throw e;
      }
    }
  }
}

export async function setTenantMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Determine tenant schema from header X-Club-Id (numeric id) or X-Club-Slug
  const clubId = req.header('X-Club-Id');
  const clubSlug = req.header('X-Club-Slug');

  let schemaName: string | null = null;
  if (clubId) schemaName = `club_${clubId}`;
  else if (clubSlug) schemaName = `club_${clubSlug}`;

  if (!schemaName) return next();

  // Attach schemaName to request for handlers to use
  (req as any).tenantSchema = schemaName;

  // Optionally set search_path for subsequent raw queries in this connection
  // Note: Prisma manages connections; setting search_path here affects current session only for raw queries executed immediately.
  try {
    await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`);
  } catch (e) {
    console.error('Failed to set search_path', e);
  }

  return next();
}
