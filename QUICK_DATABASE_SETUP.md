# 🚀 Быстрая настройка базы данных

## Проблема
Ошибка "relation 'teams' already exists" означает, что таблицы уже частично созданы.

## ✅ Решение - Безопасные миграции

### Шаг 1: Откройте Supabase Dashboard
1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. Откройте **SQL Editor**

### Шаг 2: Примените безопасные миграции

Выполните **ТОЛЬКО** эти 4 файла по порядку:

#### 1️⃣ Сначала выполните:
```sql
-- Скопируйте и выполните содержимое файла:
-- supabase/migrations/000_safe_init_schema.sql
```

#### 2️⃣ Затем выполните:
```sql
-- Скопируйте и выполните содержимое файла:
-- supabase/migrations/000_safe_rls_policies.sql
```

#### 3️⃣ Затем выполните:
```sql
-- Скопируйте и выполните содержимое файла:
-- supabase/migrations/000_safe_functions.sql
```

#### 4️⃣ Наконец выполните:
```sql
-- Скопируйте и выполните содержимое файла:
-- supabase/migrations/000_safe_resume_summary.sql
```

## ✅ Проверка

После выполнения всех 4 миграций проверьте:

1. **Таблицы созданы** (в Database > Tables):
   - ✅ profiles
   - ✅ resumes  
   - ✅ resume_summaries
   - ✅ searches
   - ✅ search_results
   - ✅ saved_candidates
   - ✅ payments
   - ✅ audit_logs
   - ✅ teams

2. **Функции созданы** (в Database > Functions):
   - ✅ can_user_search
   - ✅ check_duplicate_resume
   - ✅ search_resumes_vector
   - ✅ create_resume_summary_from_parsed_data

## 🎉 Готово!

Теперь сервис должен работать:
1. Запустите: `npm run dev`
2. Откройте: http://localhost:3001/upload
3. Загрузите тестовое резюме
4. Проверьте, что оно сохранилось!

## 🔧 Если что-то не работает

1. **Очистите базу данных** (если нужно):
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

2. **Примените миграции заново** по порядку

3. **Проверьте переменные окружения** в `.env.local`

## 📞 Поддержка

Если проблемы остаются, проверьте:
- Правильность Supabase URL и ключей
- Наличие расширения `vector` в Supabase
- Логи в Supabase Dashboard > Logs
