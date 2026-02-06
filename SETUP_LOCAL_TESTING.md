# Локальная настройка и тестирование — DzydoClub Stage 1

Этот документ описывает как поднять разработанную систему локально и запустить тесты.

## Требования

- **Node.js** 18+ (проверить: `node --version`)
- **npm** 8+ (проверить: `npm --version`)
- **PostgreSQL** 13+ (локально или через Docker)
- **Docker** (опционально, для быстрого поднятия Postgres)

## Шаг 1: Клонирование и установка зависимостей

```bash
# Clone repo if needed or navigate to existing
cd /workspace/dzydo-club

# Install dependencies
npm install
```

## Шаг 2: Поднятие Postgres

### Вариант A: Docker (рекомендуется для разработки)

```bash
# Start PostgreSQL container
docker-compose up -d

# Verify Postgres is running
docker-compose logs postgres
```

Сервис слушает на `localhost:5432`.

### Вариант B: Локально установленный PostgreSQL

Убедитесь, что:
- Postgres работает и слушает на `localhost:5432`
- Можете подключиться: `psql -U postgres -h localhost --version`

## Шаг 3: Подготовка переменных окружения

```bash
# Copy .env.example to .env (или вручную создайте .env)
cp .env.example .env

# Внутри .env убедитесь в значениях:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dzydo_club
# TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dzydo_club_test
# JWT_ACCESS_SECRET=change_me_access
# JWT_REFRESH_SECRET=change_me_refresh
# PORT=3000
# NODE_ENV=development
```

## Шаг 4: Инициализация базы данных

```bash
# Generate Prisma client from schema.prisma
npm run prisma:generate

# Apply migrations (создаст public таблицы: clubs, users, refresh_tokens, invitations)
npm run db:init

# Seed database (создаст default club, superadmin, tenant schema)
npm run db:seed
```

Ожидаемый вывод seed-a:
```
Created default club
Created superadmin: admin@dzydo.local
Initialized tenant schema: club_1
```

## Шаг 5: Запуск разработки (опционально)

```bash
# Start backend dev server (auto-restart на изменения)
npm run dev
```

Сервер слушает на `http://localhost:3000`, endpoint здоровья: `GET /health`.

## Шаг 6: Запуск тестов

```bash
# Run all tests
npm test

# или с verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/matches.test.ts
npm test -- tests/users.invite.test.ts
npm test -- tests/tenant_isolation.test.ts
```

Ожидаемо:
- `tests/matches.test.ts` — генерация турнирной сетки, повышение победителя
- `tests/users.invite.test.ts` — создание приглашения, принятие и регистрация пользователя
- `tests/tenant_isolation.test.ts` — две схемы изолированы, не пересекаются

## Шаг 7 (опционально): Протестировать API вручную

### Логин (superadmin)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dzydo.local","password":"changeme"}'

# Ответ: { "access": "...", "refresh": "..." }
# Скопируйте access token для следующих запросов
```

### Проверить здоровье

```bash
curl http://localhost:3000/health
# Ответ: { "ok": true }
```

### Создать клуб

```bash
curl -X POST http://localhost:3000/clubs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"My Club","slug":"my-club"}'
```

### Пригласить пользователя (superadmin)

```bash
curl -X POST http://localhost:3000/users/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"email":"coach@club.local","role":"COACH"}'

# Ответ: { "token": "...", "expiresAt": "..." }
# Скопируйте token для accept
```

### Принять приглашение (новый пользователь)

```bash
curl -X POST http://localhost:3000/users/accept \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_FROM_ABOVE","password":"newpass","name":"New Coach"}'

# Ответ: { "user": { "id": ..., "email": "coach@club.local", "role": "COACH" } }
```

## Решение проблем

### Ошибка: `connect ECONNREFUSED 127.0.0.1:5432`

**Решение:** PostgreSQL не запущена.
- Если используете Docker: `docker-compose up -d`
- Если локально установлена: проверьте `pg_isready -h localhost`

### Ошибка: `relation "clubs" does not exist`

**Решение:** Миграции не применены.
```bash
npm run db:init
```

### Ошибка: `permission denied for schema "public"`

**Решение:** Проблемы с доступом к БД. Проверьте `DATABASE_URL` и учётные данные Postgres в `.env`.

### Тесты зависают

**Решение:** Убедитесь что `jest.config.cjs` имеет `testTimeout: 30000`. Проверьте `npm test -- --verbose` для диагностики.

## Дополнительные команды

```bash
# Сборка TypeScript
npm run build

# Запуск скомпилированного кода
npm run start

# Lint проверка
npm run lint

# Сброс БД и переинициализация (ВНИМАНИЕ: удалит все данные!)
npm run db:reset
npm run db:seed

# Generate Prisma client (выполняется автоматически при npm install)
npm run prisma:generate
```

## Структура тестов

- `tests/matches.test.ts` — турнирная система (генерация сеток, результаты, повышение)
- `tests/users.invite.test.ts` — приглашение и регистрация пользователей
- `tests/tenant_isolation.test.ts` — проверка изоляции между тенантами (клубами)

Каждый тест:
1. Создаёт необходимые данные (`beforeAll`)
2. Выполняет тестовый сценарий (assertions)
3. Очищает данные (`afterAll`)

## CI/CD

GitHub Actions автоматически:
1. Устанавливает зависимости
2. Поднимает PostgreSQL в контейнере
3. Применяет миграции (`npm run db:init`)
4. Seed-ит БД (`npm run db:seed`)
5. Запускает тесты (`npm test`)

Конфиг: `.github/workflows/ci.yml`

## Следующие шаги (Stage 2+)

После завершения Stage 1 (ядро + авторизация + мультитенантность):

- **Stage 2**: Финансовая система (платежи, выплаты, документооборот)
- **Stage 3**: Турнирная система (Canvas UI, drag-and-drop, PDF экспорт)
- **Stage 4**: Аналитика и отчёты
- **Stage 5**: Оптимизация, безопасность, подготовка к релизу

Текущая реализация полностью покрывает **Этап 1** из `DEVELOPMENT_STEPS.md`.
