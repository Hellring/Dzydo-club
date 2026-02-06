# PR: RBAC, Invite Users Flow, Tenant Isolation Tests

Короткое описание
------------------
Этот PR добавляет недостающие элементы ядра: полноценную RBAC-модель и middleware, приглашения пользователей (invite flow) и набор тестов, проверяющих изоляцию данных между схемами (тенантами).

Цели PR
- Реализовать middleware `authorizeRoles` и централизовать проверки прав доступа для критичных endpoint'ов.
- Добавить endpoints для приглашения пользователей (`/users/invite`, `/users/accept`) и сервис отправки приглашений (placeholder для email).
- Добавить seed/миграцию для ролей и тестового супер-админа (проверить `src/seed.ts`).
- Написать интеграционные тесты, создающие 2 клуба/схемы и проверяющие, что данные не пересекаются.

Ожидаемые изменения в коде
- `src/middleware/auth.ts` — доработать `authorizeRoles` (утилиты для проверки минимум одной из ролей, улучшенные ошибки).
- `src/routes/users.ts` — новый роут для invite/list/role-management.
- `src/services/invite.ts` — генерация токена приглашения, сохранение в таблице `invitations` (новая таблица в public) и placeholder отправки email.
- `prisma/schema.prisma` — добавить модель `Invitation` и (опционально) таблицу `roles` если потребуется отдельная реализация ролей.
- `src/seed.ts` — гарантировать, что роли и супер-админ присутствуют (idempotent seed).

Тесты (интеграционные)
- `tests/users.invite.test.ts`:
  - Создаёт клуб, создаёт приглашение через `/users/invite` (as superadmin), эмулирует accept через `/users/accept?token=...`.
  - Проверяет, что созданный пользователь имеет назначенную роль и привязан к правильной схеме/клубу.

- `tests/tenant_isolation.test.ts`:
  - Создаёт два клуба (club A и club B) и вызывает `createTenantSchema` для каждого.
  - В каждой схеме создаёт спортсмена и турнир через raw SQL or API.
  - Проверяет, что запросы к `club_A` не возвращают записи `club_B` и наоборот.
  - Проверяет что `matches`/`athletes`/`tournaments` относятся только к своей схеме.

Миграции и DB changes
- Добавить в миграцию public таблицу `invitations`:
  - `id`, `email`, `role`, `token`, `expires_at`, `created_at`, `invited_by`.
- В `prisma/schema.prisma` добавить модель `Invitation` и обновить client генерацию.

CI и локальная проверка
- Обновить CI (если нужно) чтобы выполнять `npm run db:init` перед `db:seed`.
- Запуск локально (пример):
  ```bash
  docker-compose up -d
  npm ci
  npm run prisma:generate
  npm run db:init
  npm run db:seed
  npm test
  ```

Checklist для PR
- [ ] Middleware RBAC реализовано и покрыто unit-тестами
- [ ] Routes для приглашений добавлены и задокументированы
- [ ] Миграции: `invitations` и role-seed включены
- [ ] Интеграционные тесты изоляции тенантов добавлены и проходят
- [ ] README/DEVELOPMENT_STEPS обновлён с инструкциями тестирования

Рекомендации по разбивке на коммиты
1. Миграции и обновление `schema.prisma` + `prisma generate` (микро-коммит)
2. RBAC middleware и unit-тесты
3. Invite service + `invitations` таблица и routes
4. Интеграционные тесты (tenant isolation)
5. Документация и мелкие правки

Примечание
-------
Можно сделать invite flow сначала без реальной отправки email: генерация токена + логирование/вывод токена в ответе. Позже подключить провайдер отправки.

Если хотите, могу автоматически создать mock PR branch и собрать патчи для каждого шага — подтвердите, и я создам последовательность изменений.
