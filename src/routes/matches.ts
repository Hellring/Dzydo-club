import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

function schemaFromReq(req: any) {
  return req.tenantSchema as string | undefined;
}

function nextPowerOfTwo(n: number) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// Generate single-elimination bracket for tournament
router.post('/generate/:tournamentId', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });
  const tournamentId = Number(req.params.tournamentId);
  if (Number.isNaN(tournamentId)) return res.status(400).json({ error: 'invalid tournament id' });

  const participants: number[] = req.body.participants || [];
  if (!Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'participants array required' });
  }

  try {
    const n = participants.length;
    const size = nextPowerOfTwo(n);
    const byes = size - n;

    // create seed array: copy participants and pad with nulls for byes
    const seeds: (number | null)[] = participants.slice();
    for (let i = 0; i < byes; i++) seeds.push(null);

    const matches: any[] = [];
    // pair i with size-1-i for first round
    for (let i = 0; i < size / 2; i++) {
      const a = seeds[i];
      const b = seeds[size - 1 - i];
      matches.push({ tournament_id: tournamentId, athlete_a: a, athlete_b: b, round: 1, slot: i + 1 });
    }

    // insert matches
    for (const m of matches) {
      await prisma.$queryRawUnsafe(
        `INSERT INTO "${schema}".matches (tournament_id, athlete_a, athlete_b, round, slot) VALUES ($1, $2, $3, $4, $5)`,
        m.tournament_id,
        m.athlete_a,
        m.athlete_b,
        m.round,
        m.slot
      );
    }

    res.status(201).json({ created: matches.length, byes });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// List matches for tournament
router.get('/tournament/:tournamentId', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });
  const tournamentId = Number(req.params.tournamentId);
  if (Number.isNaN(tournamentId)) return res.status(400).json({ error: 'invalid tournament id' });

  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}".matches WHERE tournament_id = $1 ORDER BY round, slot`, tournamentId);
    res.json(rows);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Submit match result
router.post('/:matchId/result', async (req, res) => {
  const schema = schemaFromReq(req);
  if (!schema) return res.status(400).json({ error: 'tenant not specified' });
  const matchId = Number(req.params.matchId);
  if (Number.isNaN(matchId)) return res.status(400).json({ error: 'invalid match id' });

  const { winner, result } = req.body as { winner?: number; result?: any };
  if (typeof winner === 'undefined' && typeof result === 'undefined') return res.status(400).json({ error: 'winner or result required' });

  try {
    const existing = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}".matches WHERE id = $1`, matchId);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'match not found' });

    // update current match
    await prisma.$queryRawUnsafe(
      `UPDATE "${schema}".matches SET winner = $1, result = $2 WHERE id = $3`,
      typeof winner === 'number' ? winner : null,
      result ? JSON.stringify(result) : null,
      matchId
    );

    // auto-promote winner to next round if winner provided
    if (typeof winner === 'number') {
      const current: any = existing[0];
      const currentRound: number = current.round || 1;
      const currentSlot: number = current.slot || 1;
      const nextRound = currentRound + 1;
      const nextSlot = Math.ceil(currentSlot / 2);

      // try to find next match
      const nextMatches: any = await prisma.$queryRawUnsafe(
        `SELECT * FROM "${schema}".matches WHERE tournament_id = $1 AND round = $2 AND slot = $3`,
        current.tournament_id,
        nextRound,
        nextSlot
      );

      if (nextMatches && nextMatches.length > 0) {
        const nextMatch = nextMatches[0];
        // determine which side to fill: odd currentSlot -> athlete_a, even -> athlete_b
        if (!nextMatch.athlete_a && currentSlot % 2 === 1) {
          await prisma.$queryRawUnsafe(
            `UPDATE "${schema}".matches SET athlete_a = $1 WHERE id = $2`,
            winner,
            nextMatch.id
          );
        } else if (!nextMatch.athlete_b && currentSlot % 2 === 0) {
          await prisma.$queryRawUnsafe(
            `UPDATE "${schema}".matches SET athlete_b = $1 WHERE id = $2`,
            winner,
            nextMatch.id
          );
        } else if (!nextMatch.athlete_a) {
          // fallback: fill athlete_a if empty
          await prisma.$queryRawUnsafe(
            `UPDATE "${schema}".matches SET athlete_a = $1 WHERE id = $2`,
            winner,
            nextMatch.id
          );
        } else if (!nextMatch.athlete_b) {
          await prisma.$queryRawUnsafe(
            `UPDATE "${schema}".matches SET athlete_b = $1 WHERE id = $2`,
            winner,
            nextMatch.id
          );
        }
      } else {
        // create next match and place winner accordingly
        const athleteA = currentSlot % 2 === 1 ? winner : null;
        const athleteB = currentSlot % 2 === 0 ? winner : null;
        await prisma.$queryRawUnsafe(
          `INSERT INTO "${schema}".matches (tournament_id, athlete_a, athlete_b, round, slot) VALUES ($1, $2, $3, $4, $5)`,
          current.tournament_id,
          athleteA,
          athleteB,
          nextRound,
          nextSlot
        );
      }
    }

    res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
