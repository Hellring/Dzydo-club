import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// Helper to get tenant schema from request
function schemaFromReq(req: any) {
  return req.tenantSchema as string | undefined;
}

// List athletes
router.get('/', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });

  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}".athletes ORDER BY id`);
    res.json(rows);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Create athlete
router.post('/', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });

  const { first_name, last_name, birth_date, weight_kg } = req.body;
  if (!first_name || !last_name) return res.status(400).json({ error: 'first_name and last_name required' });

  try {
    const result: any = await prisma.$queryRawUnsafe(
      `INSERT INTO "${schema}".athletes (first_name, last_name, birth_date, weight_kg) VALUES ($1, $2, $3, $4) RETURNING *`,
      first_name,
      last_name,
      birth_date || null,
      weight_kg || null
    );
    res.status(201).json(result[0] || result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get athlete by id
router.get('/:id', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}".athletes WHERE id = $1`, id);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Update athlete
router.put('/:id', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const { first_name, last_name, birth_date, weight_kg } = req.body;

  try {
    const result: any = await prisma.$queryRawUnsafe(
      `UPDATE "${schema}".athletes SET first_name = $1, last_name = $2, birth_date = $3, weight_kg = $4 WHERE id = $5 RETURNING *`,
      first_name,
      last_name,
      birth_date || null,
      weight_kg || null,
      id
    );
    const updated = result[0];
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Delete athlete
router.delete('/:id', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    await prisma.$queryRawUnsafe(`DELETE FROM "${schema}".athletes WHERE id = $1`, id);
    res.status(204).send();
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
