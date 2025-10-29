# Полное руководство по развертыванию

Это руководство проведет вас через процесс развертывания AI Рекрутинг Платформы от начала до конца.

## Оглавление

1. [Подготовка](#подготовка)
2. [Настройка Supabase](#настройка-supabase)
3. [Настройка DeepSeek API](#настройка-deepseek-api)
4. [Настройка Resend](#настройка-resend)
5. [Локальная разработка](#локальная-разработка)
6. [Деплой на Vercel](#деплой-на-vercel)
7. [После деплоя](#после-деплоя)

## Подготовка

### Что вам понадобится

- [x] Аккаунт GitHub (для хранения кода и деплоя)
- [x] Аккаунт Supabase (бесплатный план)
- [x] DeepSeek API ключ
- [x] Аккаунт Resend для email (опционально)
- [x] Аккаунт Vercel (бесплатный план)
- [x] Node.js 18+ установлен локально

### Клонирование репозитория

```bash
git clone <your-repo-url>
cd ai-recruiting-platform
npm install
```

## Настройка Supabase

### Шаг 1: Создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "New Project"
3. Выберите организацию или создайте новую
4. Заполните:
   - **Name**: `ai-recruiting-platform`
   - **Database Password**: (сгенерируйте сложный пароль)
   - **Region**: выберите ближайший к вашим пользователям
5. Нажмите "Create new project"

⏱️ Создание проекта займет ~2 минуты.

### Шаг 2: Получение API ключей

После создания проекта:

1. Перейдите в Settings > API
2. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Важно**: `service_role` ключ должен оставаться секретным!

### Шаг 3: Включение расширений

1. Перейдите в SQL Editor
2. Создайте новый запрос
3. Выполните:

```sql
-- Базовые расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Векторное расширение для семантического поиска
CREATE EXTENSION IF NOT EXISTS "vector";
```

4. Нажмите RUN

### Шаг 4: Применение миграций

Теперь примените все миграции из папки `supabase/migrations/`:

#### Миграция 1: Основная схема

```sql
-- Скопируйте и выполните содержимое файла:
-- supabase/migrations/001_init_schema.sql
```

Это создаст все таблицы: profiles, resumes, searches, saved_candidates, payments, audit_logs.

#### Миграция 2: RLS политики

```sql
-- Скопируйте и выполните содержимое файла:
-- supabase/migrations/002_rls_policies.sql
```

Это настроит Row Level Security для защиты данных.

#### Миграция 3: Функции и триггеры

```sql
-- Скопируйте и выполните содержимое файла:
-- supabase/migrations/003_functions.sql
```

Это создаст функции для поиска, триггеры для автоматизации.

### Шаг 5: Создание Storage bucket

1. Перейдите в Storage
2. Нажмите "Create a new bucket"
3. Заполните:
   - **Name**: `resumes`
   - **Public bucket**: Включите (или настройте RLS)
4. Нажмите "Create bucket"

### Шаг 6: Настройка Authentication

1. Перейдите в Authentication > Providers
2. Включите **Email** provider
3. Перейдите в Authentication > Settings:

**Email Auth:**
- Enable email confirmations: ✅
- Secure email change: ✅

**Email Templates:**
Вы можете кастомизировать шаблоны писем или использовать Resend (см. ниже).

**Site URL:**
- Development: `http://localhost:3000`
- Production: `https://your-app.vercel.app` (добавите после деплоя)

**Redirect URLs:**
```
http://localhost:3000/auth/callback
https://your-app.vercel.app/auth/callback
```

### Шаг 7: Создание первого админа

После того как вы зарегистрируетесь в приложении, сделайте себя админом:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Настройка DeepSeek API

### Получение API ключа

1. Перейдите на [deepseek.com](https://deepseek.com)
2. Зарегистрируйтесь или войдите
3. Перейдите в API Keys
4. Создайте новый ключ
5. Скопируйте → `DEEPSEEK_API_KEY`

### Тестирование ключа

```bash
curl https://api.deepseek.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Если вернулся список моделей - всё работает!

## Настройка Resend

Resend используется для отправки email (magic links, уведомления).

### Шаг 1: Создание аккаунта

1. Перейдите на [resend.com](https://resend.com)
2. Зарегистрируйтесь
3. Подтвердите email

### Шаг 2: Верификация домена

Для production обязательно верифицируйте домен:

1. Перейдите в Domains
2. Нажмите "Add Domain"
3. Введите ваш домен (например, `yourservice.ru`)
4. Добавьте DNS записи в настройки домена
5. Дождитесь верификации

Для разработки можно использовать тестовый домен Resend.

### Шаг 3: Создание API ключа

1. Перейдите в API Keys
2. Нажмите "Create API Key"
3. Выберите права (Full Access)
4. Скопируйте → `RESEND_API_KEY`

### Шаг 4: Настройка FROM email

В `.env.local`:
```env
RESEND_FROM_EMAIL=noreply@yourservice.ru
```

Или для разработки:
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Интеграция с Supabase Auth (опционально)

Для использования Resend вместо встроенной email системы Supabase:

1. В Supabase: Authentication > Settings > SMTP Settings
2. Включите "Use custom SMTP server"
3. Заполните данные Resend SMTP:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) или `587` (TLS)
   - Username: `resend`
   - Password: ваш Resend API ключ

## Локальная разработка

### Создание .env.local

```bash
cp env.example .env.local
```

Заполните все значения:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# DeepSeek
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Resend
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@yourservice.ru

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Security
NEXTAUTH_SECRET=generate-with-openssl-rand-hex-32
ENCRYPTION_KEY=32-character-random-string-here
```

### Генерация секретных ключей

```bash
# NEXTAUTH_SECRET
openssl rand -hex 32

# ENCRYPTION_KEY (32 символа)
openssl rand -hex 16
```

### Запуск приложения

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### Тестирование основных функций

1. **Главная страница** → должна загрузиться
2. **Загрузка резюме** → `/upload` → загрузите тестовое PDF
3. **Регистрация** → `/register` → получите magic link
4. **Вход** → перейдите по ссылке из email
5. **Dashboard** → должны увидеть дашборд рекрутера

## Деплой на Vercel

### Шаг 1: Push в GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Шаг 2: Создание проекта в Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "New Project"
3. Выберите ваш GitHub репозиторий
4. Настройте проект:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Шаг 3: Добавление Environment Variables

В разделе "Environment Variables" добавьте **ВСЕ** переменные из `.env.local`:

Для production обязательно обновите:
- `NEXT_PUBLIC_APP_URL` → URL вашего Vercel приложения
- `NEXT_PUBLIC_API_URL` → `https://your-app.vercel.app/api`

**Важно**: Отметьте галочки для нужных окружений (Production, Preview, Development).

### Шаг 4: Deploy

Нажмите "Deploy" и дождитесь завершения (~2-3 минуты).

### Шаг 5: Получение production URL

После деплоя вы получите URL вида: `https://your-app.vercel.app`

## После деплоя

### Обновление Supabase настроек

1. Вернитесь в Supabase Dashboard
2. Authentication > Settings
3. Обновите:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: добавьте `https://your-app.vercel.app/auth/callback`

### Настройка кастомного домена (опционально)

В Vercel:
1. Перейдите в Settings > Domains
2. Добавьте свой домен
3. Настройте DNS записи
4. После верификации обновите URLs в Supabase и env variables

### Мониторинг

1. **Vercel Analytics**: автоматически включен
2. **Supabase Logs**: Database > Logs
3. **Application Errors**: Vercel > Logs

### Бэкапы

Настройте автоматические бэкапы Supabase:
1. Settings > Database > Backups
2. Включите Daily Backups (Pro план)

Или настройте вручную с помощью `pg_dump`.

## Troubleshooting

### Приложение не запускается локально

**Проблема**: Ошибка `Module not found`

**Решение**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Magic Link не работает

**Проблема**: Ссылка из email не работает

**Решение**:
1. Проверьте Redirect URLs в Supabase
2. Убедитесь что URL в письме совпадает с настроенным
3. Проверьте что email provider включен

### Резюме не парсится

**Проблема**: Ошибка при загрузке PDF

**Решение**:
1. Проверьте DeepSeek API ключ
2. Убедитесь что `pdf-parse` установлен: `npm install pdf-parse`
3. Проверьте логи в Vercel Functions

### Vector search не работает

**Проблема**: Ошибка `operator does not exist: vector <=> vector`

**Решение**:
Убедитесь что расширение `vector` включено:
```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

### Rate limiting от DeepSeek

**Проблема**: 429 Too Many Requests

**Решение**:
Реализуйте очередь или кэширование для embeddings.

## Следующие шаги

- [ ] Настройте мониторинг ошибок (Sentry)
- [ ] Добавьте аналитику (Google Analytics, Plausible)
- [ ] Настройте CI/CD для автоматического тестирования
- [ ] Подключите платежную систему (ЮKassa)
- [ ] Настройте email-уведомления для рекрутеров
- [ ] Добавьте тесты (Jest, Playwright)

## Поддержка

Если у вас возникли проблемы:
1. Проверьте [README.md](../README.md)
2. Создайте issue в репозитории
3. Проверьте логи в Vercel и Supabase

