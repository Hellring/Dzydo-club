import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

function schemaFromReq(req: any) {
  return req.tenantSchema as string | undefined;
}

// List groups
router.get('/', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });

  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}".groups ORDER BY id`);
    res.json(rows);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Create group
router.post('/', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });

  const { name, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  try {
    const result: any = await prisma.$queryRawUnsafe(
      `INSERT INTO "${schema}".groups (name, parent_id) VALUES ($1, $2) RETURNING *`,
      name,
      parent_id || null
    );
    res.status(201).json(result[0] || result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get group
router.get('/:id', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}".groups WHERE id = $1`, id);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Update group
router.put('/:id', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const { name, parent_id } = req.body;
  try {
    const result: any = await prisma.$queryRawUnsafe(
      `UPDATE "${schema}".groups SET name = $1, parent_id = $2 WHERE id = $3 RETURNING *`,
      name,
      parent_id || null,
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

// Delete group
router.delete('/:id', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    await prisma.$queryRawUnsafe(`DELETE FROM "${schema}".groups WHERE id = $1`, id);
    res.status(204).send();
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
