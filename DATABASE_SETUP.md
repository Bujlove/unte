# Настройка базы данных Supabase

## Проблема
Ошибка "Failed to save resume" возникает потому, что таблицы в базе данных не созданы.

## Решение

### Вариант 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Скопируйте и выполните SQL из файлов миграций по порядку:

#### 1. Создание базовых таблиц
```sql
-- Скопируйте содержимое supabase/migrations/001_init_schema.sql
```

#### 2. Настройка RLS политик
```sql
-- Скопируйте содержимое supabase/migrations/002_rls_policies.sql
```

#### 3. Создание функций
```sql
-- Скопируйте содержимое supabase/migrations/003_functions.sql
```

#### 4. Создание таблицы резюме
```sql
-- Скопируйте содержимое supabase/migrations/004_resume_summary.sql
```

### Вариант 2: Через Supabase CLI

```bash
# Установите Supabase CLI
npm install -g supabase

# Войдите в аккаунт
supabase login

# Примените миграции
supabase db push
```

### Вариант 3: Через скрипт

```bash
# Установите зависимости
npm install

# Запустите скрипт миграций
node scripts/apply-migrations.js
```

## Проверка

После применения миграций проверьте:

1. **Таблицы созданы**:
   - `profiles`
   - `resumes`
   - `resume_summaries`
   - `searches`
   - `search_results`
   - `saved_candidates`

2. **Функции созданы**:
   - `check_duplicate_resume`
   - `can_user_search`
   - `create_resume_summary_from_parsed_data`

3. **RLS политики активны**:
   - Проверьте в разделе Authentication > Policies

## Переменные окружения

Убедитесь, что в `.env.local` указаны:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ghluoqegmbeqpatatkes.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPSEEK_API_KEY=sk-8e5ea4aa5d7b4db89961ed4113a52952
OPENAI_API_KEY=your-openai-key  # Для embeddings
```

## Тестирование

После настройки базы данных:

1. Запустите сервер: `npm run dev`
2. Откройте http://localhost:3001/upload
3. Загрузите тестовое резюме
4. Проверьте, что оно сохранилось в базе данных

## Troubleshooting

### Ошибка "relation does not exist"
- Таблицы не созданы, примените миграции

### Ошибка "permission denied"
- RLS политики не настроены, примените 002_rls_policies.sql

### Ошибка "function does not exist"
- Функции не созданы, примените 003_functions.sql

### Ошибка "column does not exist"
- Схема не обновлена, примените все миграции по порядку
