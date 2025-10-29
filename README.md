# 🤖 Unte - AI Рекрутинг Платформа

**Умный поиск кандидатов с помощью искусственного интеллекта**

**Unte** - production-ready сервис для рекрутинга на базе DeepSeek API с семантическим поиском и AI-ассистентом.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek-orange)](https://deepseek.com/)

## Технологии

- **Frontend/Backend**: Next.js 14 (App Router, TypeScript, Server Components)
- **База данных**: Supabase (PostgreSQL + pgvector)
- **AI**: DeepSeek API (парсинг резюме и семантический поиск)
- **Стилизация**: Tailwind CSS + Radix UI
- **Email**: Supabase Auth (Magic Link)
- **Деплой**: Vercel

## Быстрый старт

### Предварительные требования

- Node.js 18+ и npm
- Аккаунт Supabase (бесплатный план подойдет)
- DeepSeek API ключ
- Resend API ключ (опционально для email)

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте `env.example` в `.env.local` и заполните значения:

```bash
cp env.example .env.local
```

Обязательные переменные:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# DeepSeek API
DEEPSEEK_API_KEY=sk-your-api-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Security
NEXTAUTH_SECRET=generate-random-string-here
ENCRYPTION_KEY=32-character-encryption-key-here
```

### 3. Настройка Supabase

#### 3.1 Создайте проект в Supabase

Перейдите на [supabase.com](https://supabase.com) и создайте новый проект.

#### 3.2 Включите необходимые расширения

В SQL Editor выполните:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

#### 3.3 Примените миграции

Выполните миграции из папки `supabase/migrations/` в порядке номеров:

1. `001_init_schema.sql` - основная схема БД
2. `002_rls_policies.sql` - политики безопасности
3. `003_functions.sql` - функции и триггеры

Вы можете выполнить их через SQL Editor в Supabase Dashboard или использовать Supabase CLI:

```bash
# Установка Supabase CLI
npm install -g supabase

# Инициализация
supabase init

# Связывание с проектом
supabase link --project-ref your-project-ref

# Применение миграций
supabase db push
```

#### 3.4 Создайте Storage bucket

В Supabase Dashboard:
1. Перейдите в Storage
2. Создайте новый bucket с именем `resumes`
3. Настройте публичный доступ (или настройте RLS политики по необходимости)

#### 3.5 Настройте Auth

В Authentication > Settings:
- Включите Email provider
- Настройте Email templates (используйте Resend для отправки)
- Установите Site URL: `http://localhost:3000` (для разработки)
- Добавьте Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Запуск в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Публичные страницы
│   │   ├── (auth)/            # Авторизация
│   │   ├── (protected)/       # Защищенные страницы (dashboard, search)
│   │   ├── admin/             # Админ-панель
│   │   └── api/               # API endpoints
│   ├── components/            # React компоненты
│   │   ├── ui/               # UI компоненты (Radix UI)
│   │   └── ...               # Функциональные компоненты
│   ├── lib/                   # Утилиты и библиотеки
│   │   ├── supabase/         # Supabase клиенты
│   │   ├── deepseek/         # DeepSeek AI
│   │   ├── resend/           # Email
│   │   └── ...
│   ├── types/                 # TypeScript типы
│   └── middleware.ts          # Next.js middleware
├── supabase/
│   └── migrations/            # SQL миграции
└── public/                    # Статические файлы
```

## Основной функционал

### Для соискателей
- ✅ Загрузка резюме (PDF, DOCX, DOC, TXT)
- ✅ AI парсинг резюме с извлечением структурированных данных
- ✅ Согласие на обработку персональных данных (GDPR)
- ✅ Автоудаление через 180 дней
- ✅ Уникальная ссылка для обновления резюме

### Для рекрутеров
- ✅ Авторизация через Magic Link (email)
- ✅ AI чат-ассистент для формирования требований
- ✅ Семантический поиск кандидатов (pgvector + embeddings)
- ✅ Фильтрация по навыкам, опыту, локации
- ✅ Сохранение избранных кандидатов
- ✅ Экспорт результатов (Excel/CSV)
- ✅ История поисков
- ✅ Система подписок (Trial, Start, Pro)

### Для админов
- ✅ Роль админа в системе
- ✅ Audit logs
- 🚧 Полная админ-панель (в разработке)

## Деплой на Vercel

### 1. Подготовка

Убедитесь что:
- Код находится в Git репозитории (GitHub, GitLab, Bitbucket)
- Supabase проект настроен и работает
- Все миграции применены

### 2. Создание проекта в Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "New Project"
3. Импортируйте ваш Git репозиторий
4. Настройте переменные окружения (все из `.env.local`)
5. Нажмите "Deploy"

### 3. Настройка environment variables в Vercel

Добавьте все переменные из `.env.local` в Vercel Project Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` (URL вашего Vercel приложения)
- И остальные...

### 4. Обновите Supabase Auth настройки

В Supabase Dashboard > Authentication > Settings:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

## Разработка

### Скрипты

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для production
npm run start        # Запуск production сборки
npm run lint         # Проверка ESLint
npm run format       # Форматирование кода (Prettier)
npm run type-check   # Проверка TypeScript типов
```

### Создание нового компонента

Используйте существующие паттерны:
- Server Components для статического контента
- Client Components ('use client') для интерактивности
- Supabase server client для API routes
- Supabase browser client для client components

### База данных

Для изменения схемы БД:
1. Создайте новую миграцию в `supabase/migrations/`
2. Примените её через SQL Editor или Supabase CLI
3. Обновите типы в `src/types/database.ts`

## Troubleshooting

### Ошибка "vector extension not found"

Убедитесь что расширение `vector` включено в Supabase:
```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

### Ошибка при парсинге PDF

Проверьте что зависимость `pdf-parse` установлена корректно:
```bash
npm install pdf-parse
```

### Проблемы с CORS

Убедитесь что в Supabase настроены правильные URLs в разделе Authentication.

### Email не отправляются

Проверьте:
1. Resend API ключ корректен
2. Email домен верифицирован в Resend
3. `RESEND_FROM_EMAIL` настроен правильно

## TODO / Roadmap

- [ ] Полноценная админ-панель с графиками
- [ ] Командные аккаунты (teams)
- [ ] OAuth авторизация (Google)
- [ ] Расширенные email-уведомления
- [ ] Интеграция с ЮKassa для платежей
- [ ] Webhooks для ATS систем
- [ ] Массовая загрузка резюме админом
- [ ] API документация (Swagger)
- [ ] Юнит и интеграционные тесты
- [ ] Мониторинг (Sentry)

## Лицензия

Proprietary - All rights reserved

## Поддержка

Для вопросов и поддержки создайте issue в репозитории.

