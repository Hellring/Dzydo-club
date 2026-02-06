import { Router } from 'express';
import prisma from '../prisma';
import { createTenantSchema } from '../tenant';

const router = Router();

// Create a new club and provision tenant schema
router.post('/', async (req, res) => {
  const { name, slug } = req.body as { name: string; slug: string };
  if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });

  try {
    const club = await prisma.club.create({ data: { name, slug } });
    const schemaName = `club_${club.id}`;
    await createTenantSchema(schemaName);
    return res.status(201).json({ club, schema: schemaName });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'failed' });
  }
});

export default router;
