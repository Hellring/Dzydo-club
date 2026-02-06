import express from 'express';
import swaggerUi from 'swagger-ui-express';
import authRouter from './routes/auth';
import clubsRouter from './routes/clubs';
import { setTenantMiddleware } from './tenant';
import athletesRouter from './routes/athletes';
import groupsRouter from './routes/groups';
import tournamentsRouter from './routes/tournaments';
import matchesRouter from './routes/matches';
import usersRouter from './routes/users';
import { swaggerOptions, endpoints } from '../swagger';

const app = express();
app.use(express.json());

// Swagger documentation
const swaggerDef = { ...swaggerOptions.definition, paths: endpoints };
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDef));

// Tenant middleware (reads `X-Club-Id` / `X-Club-Slug`)
app.use(setTenantMiddleware);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/clubs', clubsRouter);
app.use('/users', usersRouter);
app.use('/athletes', athletesRouter);
app.use('/groups', groupsRouter);
app.use('/tournaments', tournamentsRouter);
app.use('/matches', matchesRouter);

export default app;
