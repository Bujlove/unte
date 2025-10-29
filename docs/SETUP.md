# Настройка Unte

Подробное руководство по настройке платформы Unte для разработки и продакшна.

## 📋 Предварительные требования

- **Node.js** 18+ и npm
- **Git** для версионирования
- **Аккаунт Supabase** (бесплатный план)
- **DeepSeek API ключ**
- **Google OAuth** (опционально)

## 🚀 Быстрая настройка

### 1. Клонирование репозитория
```bash
git clone https://github.com/Bujlove/unte.git
cd unte
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Переменные окружения
```bash
cp .env.local.example .env.local
```

Заполните `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# DeepSeek API
DEEPSEEK_API_KEY=sk-your-deepseek-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

### 4. Запуск в режиме разработки
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## 🗄 Настройка Supabase

### 1. Создание проекта
1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Выберите регион (рекомендуется ближайший)
4. Дождитесь создания проекта

### 2. Получение ключей
В настройках проекта найдите:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Выполнение миграций
В SQL Editor выполните по порядку:

#### 001_init_schema.sql
```sql
-- Создание таблиц
CREATE TABLE profiles (...);
CREATE TABLE resumes (...);
-- ... остальные таблицы
```

#### 002_rls_policies.sql
```sql
-- Включение RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ... политики безопасности
```

#### 003_functions.sql
```sql
-- Создание функций
CREATE OR REPLACE FUNCTION update_updated_at();
-- ... остальные функции
```

### 4. Настройка Storage
1. Перейдите в **Storage**
2. Создайте bucket `resumes`
3. Настройте политики доступа:
```sql
-- Политика для загрузки резюме
CREATE POLICY "Users can upload resumes" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'resumes');

-- Политика для чтения резюме
CREATE POLICY "Users can view resumes" ON storage.objects
FOR SELECT USING (bucket_id = 'resumes');
```

### 5. Настройка Auth
1. Перейдите в **Authentication** → **Providers**
2. Включите **Email** (Magic Link)
3. Настройте **Google OAuth**:
   - Создайте проект в Google Cloud Console
   - Включите Google+ API
   - Создайте OAuth 2.0 credentials
   - Добавьте Client ID и Secret в Supabase

## 🤖 Настройка DeepSeek API

### 1. Получение API ключа
1. Зарегистрируйтесь на [deepseek.com](https://deepseek.com)
2. Перейдите в API секцию
3. Создайте новый API ключ
4. Скопируйте ключ в `.env.local`

### 2. Проверка API
```bash
curl -X POST "https://api.deepseek.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## 🔧 Настройка Google OAuth

### 1. Google Cloud Console
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API

### 2. OAuth 2.0 Credentials
1. Перейдите в **APIs & Services** → **Credentials**
2. Нажмите **Create Credentials** → **OAuth 2.0 Client ID**
3. Выберите **Web application**
4. Добавьте authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (для разработки)

### 3. Настройка в Supabase
1. В Supabase перейдите в **Authentication** → **Providers**
2. Включите **Google**
3. Добавьте Client ID и Client Secret из Google Console

## 🧪 Тестирование настройки

### 1. Проверка базы данных
```bash
# Проверка подключения
npm run type-check
```

### 2. Тестирование загрузки резюме
1. Откройте `/upload`
2. Загрузите тестовое резюме
3. Проверьте, что файл сохранился в Supabase Storage

### 3. Тестирование AI чата
1. Зарегистрируйтесь в системе
2. Перейдите в `/dashboard`
3. Попробуйте задать вопрос AI ассистенту

### 4. Тестирование поиска
1. Загрузите несколько резюме
2. Попробуйте найти кандидатов через AI чат
3. Проверьте результаты поиска

## 🚀 Деплой на Vercel

### 1. Подготовка
1. Убедитесь, что код работает локально
2. Закоммитьте все изменения
3. Отправьте в GitHub

### 2. Настройка Vercel
1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения
3. Настройте домен (опционально)

### 3. Переменные окружения в Vercel
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

## 🔍 Troubleshooting

### Частые проблемы

#### Ошибка подключения к Supabase
```
Error: Invalid supabaseUrl
```
**Решение**: Проверьте `NEXT_PUBLIC_SUPABASE_URL` в `.env.local`

#### Ошибка DeepSeek API
```
Error: Invalid API key
```
**Решение**: Проверьте `DEEPSEEK_API_KEY` и убедитесь, что у вас есть кредиты

#### Ошибка загрузки файлов
```
Error: Storage bucket not found
```
**Решение**: Создайте bucket `resumes` в Supabase Storage

#### Ошибка авторизации
```
Error: Invalid JWT
```
**Решение**: Проверьте настройки Auth в Supabase

### Логи и отладка

#### Локальная отладка
```bash
# Подробные логи
DEBUG=* npm run dev

# Проверка переменных
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

#### Vercel логи
```bash
# Установка Vercel CLI
npm i -g vercel

# Просмотр логов
vercel logs
```

## 📊 Мониторинг

### Supabase Dashboard
- **Database** - мониторинг запросов
- **Auth** - статистика пользователей
- **Storage** - использование файлов
- **Logs** - системные логи

### Vercel Dashboard
- **Analytics** - метрики производительности
- **Functions** - логи API маршрутов
- **Deployments** - история деплоев

## 🔒 Безопасность

### Рекомендации
1. **Никогда не коммитьте** `.env.local`
2. **Используйте сильные пароли** для Supabase
3. **Ограничьте доступ** к service_role ключу
4. **Регулярно обновляйте** зависимости
5. **Мониторьте** подозрительную активность

### Проверка безопасности
```bash
# Проверка уязвимостей
npm audit

# Обновление зависимостей
npm update

# Проверка типов
npm run type-check
```

---

Для дополнительной помощи создайте Issue в репозитории.