# 🔧 Документация бэкенда DzydoClub

**Полное описание API, архитектуры и как работать с бэкендом.**

---

## 📚 Оглавление

1. [Архитектура и ключевые концепции](#архитектура-и-ключевые-концепции)
2. [Быстрый старт](#быстрый-старт)
3. [Структура проекта](#структура-проекта)
4. [API Reference](#api-reference)
5. [Примеры использования](#примеры-использования)
6. [База данных](#база-данных)
7. [Аутентификация и авторизация](#аутентификация-и-авторизация)
8. [Мультитенантность](#мультитенантность)
9. [Запуск локально](#запуск-локально)

---

## Архитектура и ключевые концепции

### Технический стек

| Компонент | Технология |
|-----------|-----------|
| **Веб-фреймворк** | Express.js 4.18.2 |
| **Язык** | TypeScript 5.1.6 |
| **Runtime** | Node.js 18+ |
| **БД** | PostgreSQL 13+ |
| **ORM** | Prisma 4.16.2 |
| **Аутентификация** | JWT (jsonwebtoken 9.0.0) |
| **Хеширование паролей** | bcryptjs 2.4.3 |
| **Тестирование** | Jest 29.5.0 + Supertest 6.3.3 |

### Ключевые архитектурные решения

#### 1. **Мультитенантность через PostgreSQL schema**

Каждый клуб имеет **отдельную PostgreSQL schema** для полной изоляции данных:

```
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
├─────────────────────────────────────────┤
│ [public schema — общее для всех]        │
│  • clubs                                │
│  • users                                │
│  • refresh_tokens                       │
│  • invitations                          │
├─────────────────────────────────────────┤
│ [club_1 schema — только для клуба 1]    │
│  • athletes                             │
│  • groups                               │
│  • tournaments                          │
│  • matches                              │
├─────────────────────────────────────────┤
│ [club_2 schema — только для клуба 2]    │
│  • athletes (другие данные!)            │
│  • groups                               │
│  • tournaments                          │
│  • matches                              │
└─────────────────────────────────────────┘
```

**Преимущества:**
- Полная изоляция данных
- Легко резервировать/восстанавливать по клубу
- Нет необходимости в фильтрации `WHERE club_id=...` на каждый запрос

#### 2. **JWT Аутентификация с двумя токенами**

```
┌──────────────────────────────────────────┐
│      POST /auth/login                    │
│      { email, password }                 │
└──────────────────┬───────────────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │  Проверка credentials       │
    │  Хеширование паролем bcrypt │
    └──────────────┬──────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │ Генерация двух JWT токенов:          │
    ├──────────────────────────────────────┤
    │ access_token (15 минут)              │
    │  └─ Используется в Authorization    │
    │                                      │
    │ refresh_token (30 дней)              │
    │  └─ Хранится в refresh_tokens таб.  │
    │  └─ Меняется на новый access        │
    └──────────────────────────────────────┘
```

**Процесс:**
1. Логин → подтверждение пароля
2. Выдача access (15 мин) + refresh (30 дней) токенов
3. Refresh токен сохраняется в БД
4. При истечении access → POST /auth/refresh с refresh токеном
5. Логаут → удаление refresh токена из БД

#### 3. **RBAC — Role-Based Access Control**

6 ролей в системе:

| Роль | Описание | Права |
|------|---------|-------|
| **SUPERADMIN** | Суперадминистратор системы | Создавать клубы, приглашать администраторов |
| **ADMIN** | Администратор клуба | Управлять пользователями, спортсменами, документами |
| **COACH** | Тренер | Управлять спортсменами в своём клубе, проводить тренировки |
| **JUDGE** | Судья | Проводить матчи, вводить результаты |
| **ATHLETE** | Спортсмен | Просмотр своего профиля, участие в турнирах |
| **PARENT** | Родитель | Просмотр профилей спортсменов (своих детей) |

**Проверка в middleware:**
```typescript
router.post('/users/invite', 
  authenticateJWT,
  authorizeRoles('SUPERADMIN', 'ADMIN'),  // Только эти роли
  async (req, res) => { ... }
);
```

#### 4. **Отсутствие публичной регистрации**

Нельзя просто так создать пользователя. Процесс:

```
ADMIN инициирует приглашение
        ↓
Генерируется токен приглашения (7 дней)
        ↓
Токен отправляется (via email или выводится)
        ↓
Новый пользователь GET /users/accept?token=...
        ↓
Вводит пароль и принимает роль
        ↓
Пользователь регистрируется
        ↓
Токен удаляется (одноразовый)
```

---

## Быстрый старт

### 1️⃣ Установка зависимостей

```bash
npm install
```

### 2️⃣ Подготовка БД (с Docker)

```bash
# Поднять PostgreSQL контейнер
docker-compose up -d

# Проверить что контейнер запустился
docker ps
```

### 3️⃣ Инициализация

```bash
# Создать клиент Prisma
npm run prisma:generate

# Выполнить миграции (создадут public таблицы)
npm run db:init

# Seed БД (создаст superadmin и первого клуба)
npm run db:seed
```

### 4️⃣ Запуск локально

```bash
npm run dev
# Сервер слушает на http://localhost:8081
```

### 5️⃣ Проверка здоровья

```bash
curl http://localhost:8081/health
# Ответ: { "ok": true }
```

### 6️⃣ Запуск тестов

```bash
npm test
```

---

## Структура проекта

```
src/
├── index.ts                    # Точка входа сервера
├── app.ts                      # Express приложение с маршрутами
├── server.ts                   # (вспомогательный файл)
├── prisma.ts                   # Singleton Prisma клиент
├── seed.ts                     # Database seeder (инициализация)
│
├── middleware/
│   └── auth.ts                 # JWT & RBAC middleware
│       • authenticateJWT       # Проверяет JWT токен
│       • authorizeRoles        # Проверяет роли
│
├── services/
│   └── invite.ts               # Сервис приглашений
│       • createInvitation      # Генерирует токен + сохраняет в БД
│       • findInvitationByToken # Ищет приглашение по токену
│       • consumeInvitation     # Удаляет приглашение (одноразовое)
│
├── routes/
│   ├── auth.ts                 # /auth/* — аутентификация
│   │   • POST /login
│   │   • POST /refresh
│   │   • POST /logout
│   │
│   ├── users.ts                # /users/* — управление пользователями
│   │   • POST /invite          (SUPERADMIN/ADMIN)
│   │   • POST /accept          (публичный)
│   │   • GET /                 (SUPERADMIN/ADMIN)
│   │
│   ├── clubs.ts                # /clubs/* — управление клубами + provision
│   │   • POST /                (создаёт клуб + schema)
│   │
│   ├── athletes.ts             # /athletes/* — спортсмены (tenant-aware)
│   │   • GET /
│   │   • POST /
│   │   • GET /:id
│   │   • PUT /:id
│   │   • DELETE /:id
│   │
│   ├── groups.ts               # /groups/* — группы/категории
│   │   [та же структура]
│   │
│   ├── tournaments.ts           # /tournaments/* — турниры
│   │   [та же структура]
│   │
│   └── matches.ts              # /matches/* — матчи, сетки, результаты
│       • POST /generate/:tournamentId  (создать сетку)
│       • GET /tournament/:tournamentId (список матчей)
│       • POST /:matchId/result         (результат)
│
├── tenant.ts                   # Мультитенантность
│   • createTenantSchema()      # Создаёт schema для клуба
│   • setTenantMiddleware()     # Автоматически выбирает schema по X-Club-Id header
│
prisma/
├── schema.prisma               # ORM схема (для public таблиц)
├── migrations/
│   ├── 0001_init/              # Public schema: clubs, users, refresh_tokens
│   └── 0002_invitations/       # Таблица invitations
│
└── tenant_schema.sql           # Template для создания tenant schema

tests/
├── matches.test.ts             # Интеграционный тест турнирной системы
├── users.invite.test.ts        # Интеграционный тест приглашений
└── tenant_isolation.test.ts    # Интеграционный тест мультитенантности
```

---

## API Reference

### 🔐 Аутентификация (`/auth`)

#### `POST /auth/login`

**Логин пользователя**

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dzydo.local",
    "password": "changeme"
  }'
```

**Ответ (200):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Использование в следующих запросах:**
```bash
curl -X GET http://localhost:8080/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### `POST /auth/refresh`

**Обновление access токена**

```bash
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

**Ответ (200):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### `POST /auth/logout`

**Разлогин (удаление refresh токена)**

```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

**Ответ (200):**
```json
{
  "ok": true
}
```

---

### 👥 Пользователи (`/users`)

#### `POST /users/invite`

**Создать приглашение (SUPERADMIN/ADMIN только)**

```bash
curl -X POST http://localhost:8080/users/invite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@club.local",
    "role": "COACH"
  }'
```

**Ответ (201):**
```json
{
  "token": "a1b2c3d4e5f6...",
  "expiresAt": "2026-02-16T12:34:56.789Z"
}
```

**Доступные роли:**
- `SUPERADMIN`
- `ADMIN`
- `COACH`
- `JUDGE`
- `ATHLETE`
- `PARENT`

---

#### `POST /users/accept`

**Принять приглашение и создать пользователя (публичный)**

```bash
curl -X POST http://localhost:8080/users/accept \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6...",
    "password": "newpassword123",
    "name": "John Coach"
  }'
```

**Ответ (201):**
```json
{
  "user": {
    "id": 2,
    "email": "coach@club.local",
    "role": "COACH"
  }
}
```

---

#### `GET /users`

**Список всех пользователей (SUPERADMIN/ADMIN только)**

```bash
curl -X GET http://localhost:8080/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ответ (200):**
```json
[
  {
    "id": 1,
    "email": "admin@dzydo.local",
    "name": "Super Admin",
    "role": "SUPERADMIN",
    "createdAt": "2026-02-06T10:00:00Z"
  },
  {
    "id": 2,
    "email": "coach@club.local",
    "name": "John Coach",
    "role": "COACH",
    "createdAt": "2026-02-06T11:00:00Z"
  }
]
```

---

### 🏢 Клубы (`/clubs`)

#### `POST /clubs`

**Создать новый клуб (автоматически создаст schema для него)**

```bash
curl -X POST http://localhost:8080/clubs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Judo Club Pro",
    "slug": "judo-pro"
  }'
```

**Ответ (201):**
```json
{
  "club": {
    "id": 1,
    "name": "Judo Club Pro",
    "slug": "judo-pro",
    "createdAt": "2026-02-06T12:00:00Z"
  },
  "schema": "club_1"
}
```

---

### 🤸 Спортсмены (`/athletes`)

**Внимание:** Все запросы требуют `X-Club-Id` header для выбора tenant schema!

#### `GET /athletes`

**Список спортсменов в клубе**

```bash
curl -X GET http://localhost:8080/athletes \
  -H "X-Club-Id: 1"
```

**Ответ (200):**
```json
[
  {
    "id": 1,
    "external_id": "550e8400-e29b-41d4-a716-446655440000",
    "first_name": "Ivan",
    "last_name": "Ivanov",
    "birth_date": "2005-01-15",
    "weight_kg": 75.5,
    "created_at": "2026-02-06T12:00:00Z"
  }
]
```

---

#### `POST /athletes`

**Создать спортсмена**

```bash
curl -X POST http://localhost:8080/athletes \
  -H "X-Club-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ivan",
    "last_name": "Ivanov",
    "birth_date": "2005-01-15",
    "weight_kg": 75.5
  }'
```

**Ответ (201):**
```json
{
  "id": 1,
  "external_id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "Ivan",
  "last_name": "Ivanov",
  "birth_date": "2005-01-15",
  "weight_kg": 75.5,
  "created_at": "2026-02-06T12:00:00Z"
}
```

---

#### `GET /athletes/:id`

**Получить спортсмена по ID**

```bash
curl -X GET http://localhost:8080/athletes/1 \
  -H "X-Club-Id: 1"
```

---

#### `PUT /athletes/:id`

**Обновить спортсмена**

```bash
curl -X PUT http://localhost:8080/athletes/1 \
  -H "X-Club-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "weight_kg": 76.0
  }'
```

---

#### `DELETE /athletes/:id`

**Удалить спортсмена**

```bash
curl -X DELETE http://localhost:8080/athletes/1 \
  -H "X-Club-Id: 1"
```

**Ответ (204):** пустой с кодом 204

---

### 📊 Группы (`/groups`)

Аналогичная структура как `/athletes`:

```bash
# GET /groups
curl -X GET http://localhost:8080/groups -H "X-Club-Id: 1"

# POST /groups
curl -X POST http://localhost:8080/groups \
  -H "X-Club-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Junior 12-14", "parent_id": null}'

# GET /groups/:id
curl -X GET http://localhost:8080/groups/1 -H "X-Club-Id: 1"

# PUT /groups/:id
curl -X PUT http://localhost:8080/groups/1 \
  -H "X-Club-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Junior 13-16"}'

# DELETE /groups/:id
curl -X DELETE http://localhost:8080/groups/1 -H "X-Club-Id: 1"
```

---

### 🎯 Турниры (`/tournaments`)

```bash
# GET /tournaments
curl -X GET http://localhost:8080/tournaments -H "X-Club-Id: 1"

# POST /tournaments
curl -X POST http://localhost:8080/tournaments \
  -H "X-Club-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Regional Championship 2026",
    "starts_at": "2026-03-15T10:00:00Z",
    "ends_at": "2026-03-15T18:00:00Z"
  }'

# GET /tournaments/:id
curl -X GET http://localhost:8080/tournaments/1 -H "X-Club-Id: 1"

# PUT /tournaments/:id
curl -X PUT http://localhost:8080/tournaments/1 \
  -H "X-Club-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"name": "National Championship 2026"}'

# DELETE /tournaments/:id
curl -X DELETE http://localhost:8080/tournaments/1 -H "X-Club-Id: 1"
```

---

### ⚔️ Матчи и сетки (`/matches`)

#### `POST /matches/generate/:tournamentId`

**Сгенерировать турнирную сетку (олимпийскую систему)**

```bash
curl -X POST http://localhost:8080/matches/generate/1 \
  -H "X-Club-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [1, 2, 3, 4, 5, 6]
  }'
```

**Что происходит:**
- Вычисляется ближайшая степень двойки (для 6 участников → 8 слотов)
- Создаются 2 bye (автоматические победы = null участник)
- Генерируется первый раунд (Round 1)
- Система готова для ввода результатов

**Ответ (201):**
```json
{
  "created": 4,
  "byes": 2
}
```

(Создано 4 матча с 2 bye)

---

#### `GET /matches/tournament/:tournamentId`

**Получить все матчи турнира**

```bash
curl -X GET http://localhost:8080/matches/tournament/1 \
  -H "X-Club-Id: 1"
```

**Ответ (200):**
```json
[
  {
    "id": 1,
    "tournament_id": 1,
    "athlete_a": 1,
    "athlete_b": null,
    "winner": null,
    "round": 1,
    "slot": 1,
    "result": null,
    "created_at": "2026-02-06T12:00:00Z"
  },
  {
    "id": 2,
    "tournament_id": 1,
    "athlete_a": 2,
    "athlete_b": 3,
    "winner": null,
    "round": 1,
    "slot": 2,
    "result": null,
    "created_at": "2026-02-06T12:00:00Z"
  }
]
```

---

#### `POST /matches/:matchId/result`

**Ввести результат матча (автоматически повысит победителя в следующий раунд)**

```bash
curl -X POST http://localhost:8080/matches/1/result \
  -H "X-Club-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "winner": 1,
    "result": {
      "method": "ippon",
      "score": "4:0",
      "time": 120
    }
  }'
```

**Что происходит:**
1. ✅ Матч # 1 обновляется: winner=1, result сохраняется
2. 🎯 Автоматически создаётся/обновляется матч во втором раунде
3. 🏆 Победитель добавляется в правильный слот

**Ответ (200):**
```json
{
  "ok": true
}
```

---

### ❤️ Health Check

#### `GET /health`

**Проверка здоровья сервера**

```bash
curl http://localhost:8080/health
```

**Ответ (200):**
```json
{
  "ok": true
}
```

---

## Примеры использования

### Сценарий 1: Полный workflow создания турнира

```bash
# 1. ЛОГИН (как superadmin)
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dzydo.local",
    "password": "changeme"
  }' | jq -r '.access')

echo "Token: $TOKEN"

# 2. СОЗДАТЬ КЛУБ
CLUB=$(curl -s -X POST http://localhost:8080/clubs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Judo Pro", "slug": "judo-pro"}' | jq '.club.id')

echo "Club ID: $CLUB"

# 3. ДОБАВИТЬ СПОРТСМЕНОВ
for i in {1..6}; do
  curl -s -X POST http://localhost:8080/athletes \
    -H "X-Club-Id: $CLUB" \
    -H "Content-Type: application/json" \
    -d "{\"first_name\": \"Athlete\", \"last_name\": \"$i\", \"weight_kg\": $((70 + i))}" > /dev/null
  echo "Added athlete $i"
done

# 4. ПОЛУЧИТЬ ID СПОРТСМЕНОВ
ATHLETES=$(curl -s -X GET http://localhost:8080/athletes -H "X-Club-Id: $CLUB" | jq '[.[].id]')
echo "Athletes: $ATHLETES"

# 5. СОЗДАТЬ ТУРНИР
TOURNAMENT=$(curl -s -X POST http://localhost:8080/tournaments \
  -H "X-Club-Id: $CLUB" \
  -H "Content-Type: application/json" \
  -d '{"name": "Regional Cup 2026"}' | jq '.id')

echo "Tournament ID: $TOURNAMENT"

# 6. СГЕНЕРИРОВАТЬ СЕТКУ
curl -s -X POST http://localhost:8080/matches/generate/$TOURNAMENT \
  -H "X-Club-Id: $CLUB" \
  -H "Content-Type: application/json" \
  -d "{\"participants\": $ATHLETES}" | jq '.'

# 7. ПРОСМОТРЕТЬ МАТЧИ
curl -s -X GET http://localhost:8080/matches/tournament/$TOURNAMENT \
  -H "X-Club-Id: $CLUB" | jq '.'

# 8. ВВЕСТИ РЕЗУЛЬТАТ ПЕРВОГО МАТЧА
FIRST_MATCH=$(curl -s -X GET http://localhost:8080/matches/tournament/$TOURNAMENT \
  -H "X-Club-Id: $CLUB" | jq '.[0].id')

curl -s -X POST http://localhost:8080/matches/$FIRST_MATCH/result \
  -H "X-Club-Id: $CLUB" \
  -H "Content-Type: application/json" \
  -d '{"winner": 1, "result": {"method": "ippon", "time": 120}}' | jq '.'

# 9. ПРОВЕРИТЬ ВТОРОЙ РАУНД
curl -s -X GET http://localhost:8080/matches/tournament/$TOURNAMENT \
  -H "X-Club-Id: $CLUB" | jq '.[] | select(.round == 2) | .'
```

---

### Сценарий 2: Приглашение нового пользователя

```bash
# 1. ЛОГИН как superadmin
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dzydo.local","password":"changeme"}' | jq -r '.access')

# 2. ПРИГЛАСИТЬ ТРЕНЕРА
INVITE=$(curl -s -X POST http://localhost:8080/users/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"coach@club.local","role":"COACH"}' | jq -r '.token')

echo "Invitation token: $INVITE"

# 3. НОВЫЙ ПОЛЬЗОВАТЕЛЬ ПРИНИМАЕТ ПРИГЛАШЕНИЕ
curl -s -X POST http://localhost:8080/users/accept \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$INVITE\",\"password\":\"coachpass123\",\"name\":\"John Coach\"}" | jq '.'

# 4. НОВЫЙ ПОЛЬЗОВАТЕЛЬ ЛОГИРУЕТСЯ
NEW_TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coach@club.local","password":"coachpass123"}' | jq -r '.access')

echo "New user token: $NEW_TOKEN"

# 5. СПИСОК ПОЛЬЗОВАТЕЛЕЙ
curl -s -X GET http://localhost:8080/users \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## База данных

### Public Schema (общий для всех клубов)

Создаётся в миграции `0001_init`:

#### `clubs` таблица

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | INTEGER PK | Уникальный ID клуба |
| `name` | TEXT | Название клуба |
| `slug` | TEXT UNIQUE | URL-friendly slug |
| `createdAt` | TIMESTAMPTZ | Время создания |

```sql
SELECT * FROM clubs;
-- id | name          | slug     | createdAt
-- 1  | Judo Club Pro | judo-pro | 2026-02-06 10:00:00
```

---

#### `users` таблица

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | INTEGER PK | Уникальный ID |
| `email` | TEXT UNIQUE | Email (уникальный) |
| `name` | TEXT | Имя пользователя |
| `password` | TEXT | Хеш пароля (bcrypt) |
| `role` | role ENUM | SUPERADMIN, ADMIN, COACH, JUDGE, ATHLETE, PARENT |
| `createdAt` | TIMESTAMPTZ | Время создания |

```sql
SELECT id, email, role FROM users;
-- id | email              | role
-- 1  | admin@dzydo.local  | SUPERADMIN
-- 2  | coach@club.local   | COACH
```

---

#### `refresh_tokens` таблица

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | INTEGER PK | Уникальный ID |
| `token` | TEXT UNIQUE | JWT refresh token |
| `userId` | INTEGER FK | Внешний ключ на users |
| `expiresAt` | TIMESTAMPTZ | Дата истечения |
| `createdAt` | TIMESTAMPTZ | Время создания |

```sql
SELECT token, user_id, expires_at FROM refresh_tokens WHERE user_id = 1;
```

---

#### `invitations` таблица

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | INTEGER PK | Уникальный ID |
| `email` | TEXT | Email приглашённого |
| `role` | role ENUM | Роль для нового пользователя |
| `token` | TEXT UNIQUE | Токен приглашения (одноразовый) |
| `expiresAt` | TIMESTAMPTZ | Дата истечения (7 дней) |
| `invitedBy` | INTEGER FK | ID того, кто пригласил |
| `createdAt` | TIMESTAMPTZ | Время создания |

```sql
SELECT email, token, role FROM invitations WHERE expires_at > now();
```

---

### Tenant Schema (отдельно для каждого клуба)

Создаётся на лету при создании клуба. Название: `club_{id}`.

Например, для клуба ID=1: schema `club_1`.

#### `athletes` таблица

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | INTEGER PK | Уникальный ID в этой схеме |
| `external_id` | UUID | UUID для интеграции |
| `first_name` | TEXT | Имя |
| `last_name` | TEXT | Фамилия |
| `birth_date` | DATE | Дата рождения |
| `weight_kg` | REAL | Вес в кг |
| `created_at` | TIMESTAMPTZ | Время создания |

```sql
SELECT * FROM club_1.athletes LIMIT 1;
```

---

#### `groups` таблица

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | INTEGER PK | Уникальный ID |
| `name` | TEXT | Название группы (Junior 12-14, etc) |
| `parent_id` | INTEGER FK | Для иерархии (опционально) |
| `created_at` | TIMESTAMPTZ | Время создания |

```sql
SELECT * FROM club_1.groups;
```

---

#### `tournaments` таблица

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | INTEGER PK | Уникальный ID |
| `name` | TEXT | Название турнира |
| `starts_at` | TIMESTAMPTZ | Начало |
| `ends_at` | TIMESTAMPTZ | Конец |
| `created_at` | TIMESTAMPTZ | Время создания |

---

#### `matches` таблица

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | INTEGER PK | Уникальный ID |
| `tournament_id` | INTEGER FK | На какой турнир |
| `athlete_a` | INTEGER FK | Первый участник (или null для bye) |
| `athlete_b` | INTEGER FK | Второй участник (или null для bye) |
| `winner` | INTEGER FK | ID победителя (или null) |
| `result` | JSONB | Детали результата: `{method, score, time}` |
| `round` | INTEGER | Номер раунда (1, 2, 3, ...) |
| `slot` | INTEGER | Слот в раунде (порядковый номер) |
| `created_at` | TIMESTAMPTZ | Время создания |

```sql
SELECT id, athlete_a, athlete_b, winner, round FROM club_1.matches ORDER BY round, slot;
-- id | athlete_a | athlete_b | winner | round
-- 1  | 1         | null      | 1      | 1
-- 2  | 2         | 3         | 2      | 1
-- 3  | 4         | 5         | null   | 1
-- 4  | 1         | 2         | null   | 2
```

---

## Аутентификация и авторизация

### JWT Структура

**Access Token:**
```json
{
  "sub": 1,
  "role": "COACH",
  "iat": 1707296400,
  "exp": 1707297300
}
```

**Срок действия:** 15 минут

**Refresh Token:**
```json
{
  "sub": 1,
  "iat": 1707296400,
  "exp": 1739832400
}
```

**Срок действия:** 30 дней

### Как использовать JWT

**Всегда включайте в header:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Пример:**
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Проверка ролей в коде

```typescript
// Middleware проверяет роль перед тем, как дать доступ
router.post('/users/invite',
  authenticateJWT,           // ← Проверяет что токен валидный
  authorizeRoles('SUPERADMIN', 'ADMIN'),  // ← Проверяет роль
  async (req, res) => {
    // Здесь уже гарантированно пользователь SUPERADMIN или ADMIN
    const user = (req as any).user; // { id, role }
    ...
  }
);
```

---

## Мультитенантность

### Как выбирается schema

**Middleware `setTenantMiddleware` в src/tenant.ts:**

```typescript
export async function setTenantMiddleware(req: Request, res: Response, next: NextFunction) {
  // Прочитать X-Club-Id header
  const clubId = req.header('X-Club-Id');
  
  if (clubId) {
    // Создать имя schema
    const schemaName = `club_${clubId}`;
    
    // Сохранить в request объект для использования в маршрутах
    (req as any).tenantSchema = schemaName;
    
    // Переключить PostgreSQL search_path на эту schema
    await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`);
  }
  
  return next();
}
```

### Как использовать в маршруте

```typescript
router.get('/athletes', async (req, res) => {
  const schema = (req as any).tenantSchema; // "club_1"
  
  if (!schema) {
    return res.status(400).json({ error: 'tenant not specified' });
  }
  
  // Запрос автоматически идёт в правильную schema
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM "${schema}".athletes`
  );
  
  res.json(rows);
});
```

### Правила

- **Все tenant-specific запросы требуют `X-Club-Id` header**
- **Public schema (users, clubs, refresh_tokens, invitations) доступна всегда**
- **Данные полностью изолированы между schema'ми** — нет способа "случайно" достучаться до чужого клуба

**Пример:** Если в БД есть:
- `club_1.athletes` — спортсмены клуба 1
- `club_2.athletes` — спортсмены клуба 2

И вы делаете запрос с `X-Club-Id: 1`, вы **никогда** не увидите `club_2.athletes`.

---

## Запуск локально

### Требования

- Node.js 18+
- npm 8+
- PostgreSQL 13+ (или Docker)

### Полная инструкция

```bash
# 1. Clone / перейти в папку
cd /workspace/dzydo-club

# 2. Установить зависимости
npm install

# 3. Поднять Postgres (вариант A: Docker)
docker-compose up -d

# 4. Проверить что Postgres запустился
docker-compose logs postgres

# 5. Создать .env (если её нет)
cp .env.example .env

# 6. Сгенерировать Prisma клиент
npm run prisma:generate

# 7. Выполнить миграции
npm run db:init

# 8. Seed БД (создаст superadmin + default club)
npm run db:seed

# 9. Запустить dev сервер
npm run dev

# 10. В другом терминале: проверить здоровье
curl http://localhost:8080/health

# 11. Запустить тесты
npm test

# 12. Запустить lint
npm run lint
```

### Частые проблемы

**`connect ECONNREFUSED 127.0.0.1:5432`**  
Postgres не запустился. Проверьте: `docker ps`

**`relation "clubs" does not exist`**  
Миграции не применены. Запустите: `npm run db:init`

**Тесты зависают**  
Убедитесь что в `jest.config.cjs` есть `testTimeout: 30000`.

---

## Конфигурация (.env)

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dzydo_club

# Для тестов (отдельная БД)
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dzydo_club_test

# JWT secrets (меняйте в продакшене!)
JWT_ACCESS_SECRET=test_access_secret_12345
JWT_REFRESH_SECRET=test_refresh_secret_12345

# Порт сервера
PORT=8081

# Окружение
NODE_ENV=development
```

---

## npm Скрипты

```bash
npm run build              # Скомпилировать TypeScript в dist/
npm run dev                # Запустить dev сервер на http://localhost:8081
npm start                  # Запустить скомпилированный бинарник
npm test                   # Запустить Jest тесты
npm run lint               # ESLint проверка
npm run prisma:generate    # Сгенерировать Prisma client
npm run db:init            # Выполнить миграции
npm run db:reset           # ⚠️ Сбросить БД (удалит все данные!)
npm run db:seed            # Seed (инициализация)
npm run setup              # Все в одной команде: generate → init → seed
```

---

## Контакты и поддержка

Вопросы по API, архитектуре или конфигурации:
1. Проверьте примеры в этом документе
2. Посмотрите тесты в `tests/`
3. Читайте код в `src/routes/` и `src/services/`

---

**Дата создания:** 9 февраля 2026  
**Версия:** 1.0  
**Статус:** Production Ready ✅
