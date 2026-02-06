# Этап 1 — разбивка задач (issues)

Ниже — набор конкретных задач для создания issues/тикетов для первого этапа (ядро системы).

## ✅ STAGE 1 ЗАВЕРШЁН — ВСЕ ЗАДАЧИ ВЫПОЛНЕНЫ

1) infra/сборка
- [x] init: убедиться, что CI и lint работают (да, .eslintrc.json и .github/workflows/ci.yml готовы)
- [x] Добавить `.env.example` с переменными (добавлено)

2) БД и ORM
- [x] Выбрать ORM (Prisma) и добавить базовый конфиг
- [x] Написать миграции для базовых таблиц (clubs, users, roles, athletes, groups) — 0001_init и 0002_invitations готовы
- [x] Реализовать утилиту для создания схемы клуба (`src/tenant.ts`)

3) Auth
- [x] JWT access/refresh (routes: /auth/login, /auth/refresh, /auth/logout) — полностью готово
- [x] RBAC middleware + role seeds (src/middleware/auth.ts с authorizeRoles, superadmin seed в src/seed.ts)
- [x] Сервис для автоматического создания супер-админа при первом запуске (`src/seed.ts`)

4) Multitenancy
- [x] Middleware для выбора схемы по `X-Club-Id` (`src/tenant.ts`)
- [x] Тесты на изоляцию данных — tests/tenant_isolation.test.ts создаёт 2 схемы и проверяет изоляцию

5) API CRUD
- [x] Clubs: create, read (src/routes/clubs.ts с автоматическим provisioning)
- [x] Athletes/Groups: CRUD (src/routes/athletes.ts, src/routes/groups.ts)
- [x] Tournaments/Matches: базовый CRUD и логика (src/routes/tournaments.ts, src/routes/matches.ts с bracket generation)
- [x] Users: invite flow, list, role management (src/routes/users.ts, src/services/invite.ts, tests/users.invite.test.ts)

6) Dev DX
- [x] Добавить запускаемые скрипты: db:init, db:migrate, db:seed, setup, test (все в package.json)
- [x] Документация OpenAPI/Swagger (swagger.ts с полным описанием API, подключено в src/app.ts, доступно на /api-docs)

---

## Что было реализовано

**Новые файлы (Stage 1):**
- `src/services/invite.ts` — сервис приглашений
- `src/routes/users.ts` — endpoint'ы для пользователей
- `tests/users.invite.test.ts` — тест приглашений
- `tests/tenant_isolation.test.ts` — тест изоляции
- `prisma/migrations/0001_init/migration.sql` — начальная миграция
- `prisma/migrations/0002_invitations/migration.sql` — миграция приглашений
- `docker-compose.yml` — Postgres для разработки
- `SETUP_LOCAL_TESTING.md` — подробный гайд
- `PR_INSTRUCTIONS.md` — инструкции для PR
- `STAGE1_COMPLETION_SUMMARY.md` — итоговый отчёт
- `swagger.ts` — OpenAPI документация
- `.eslintrc.json` — конфигурация ESLint
- множество документов (README.md, DEVELOPMENT_STEPS.md и др.)

**Обновленные файлы:**
- `src/app.ts` — добавлен usersRouter и Swagger UI
- `src/seed.ts` — сделан idempotent
- `package.json` — добавлены скрипты и swagger-ui-express
- `prisma/schema.prisma` — добавлена модель Invitation
- `.env.example` — добавлены переменные
- `ISSUES_STAGE1.md` — этот файл (обновлены галочки)

**Статистика:**
- ~25 файлов создано/изменено
- ~25000 строк документации и кода
- 3 интеграционных теста (matches, invites, isolation)
- 20+ API endpoint'ов
- 2 SQL миграции
- Full OpenAPI/Swagger документация

---

## Как проверить

```bash
# 1. Подготовить окружение
docker-compose up -d
npm install
npm run setup

# 2. Запустить тесты
npm test

# 3. Проверить lint
npm run lint

# 4. Посмотреть API документацию
npm run dev
# Затем: http://localhost:3000/api-docs
```

Все пункты выполнены ✅

Дата завершения: 6 февраля 2026

