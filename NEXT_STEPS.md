# Следующие шаги для запуска AI Рекрутинг Платформы

## ✅ Что уже готово

Проект полностью настроен и готов к развертыванию! Вот что реализовано:

### Инфраструктура
- ✅ Next.js 14 с TypeScript и App Router
- ✅ Tailwind CSS с кастомной темой (#098936)
- ✅ Полная структура папок
- ✅ ESLint, Prettier, TypeScript конфигурация

### База данных
- ✅ Полная схема PostgreSQL с pgvector
- ✅ 3 миграции готовы к применению
- ✅ RLS политики для безопасности
- ✅ Функции и триггеры
- ✅ Audit logs

### Функционал
- ✅ Magic Link авторизация
- ✅ Загрузка и парсинг резюме (PDF, DOCX, DOC, TXT)
- ✅ AI чат-ассистент для рекрутеров
- ✅ Семантический поиск с vector embeddings
- ✅ Dashboard для рекрутеров
- ✅ Просмотр деталей кандидатов
- ✅ Система подписок (Trial, Start, Pro)
- ✅ Биллинг страница
- ✅ Настройки пользователя
- ✅ Базовая админ-панель

### Документация
- ✅ README.md
- ✅ docs/SETUP.md - детальное руководство
- ✅ docs/ARCHITECTURE.md - архитектура
- ✅ CONTRIBUTING.md - для разработчиков
- ✅ CHANGELOG.md - история версий

### CI/CD
- ✅ GitHub Actions workflows
- ✅ Vercel конфигурация
- ✅ SEO оптимизация (sitemap, robots.txt)

## 🚀 Шаги для запуска

### 1. Установка Node.js и зависимостей

```bash
# Убедитесь что Node.js 18+ установлен
node --version

# Установите зависимости
cd /Users/dmitrybuylov/Desktop/unte_ve
npm install
```

### 2. Создайте Supabase проект

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "New Project"
3. Заполните данные:
   - Name: `ai-recruiting-platform`
   - Database Password: (сгенерируйте сложный)
   - Region: выберите ближайший

⏱️ Подождите ~2 минуты пока проект создается.

### 3. Настройте Supabase

#### 3.1 Включите расширения

В SQL Editor выполните:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

#### 3.2 Примените миграции

Выполните по порядку содержимое файлов:
1. `supabase/migrations/001_init_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions.sql`

#### 3.3 Создайте Storage bucket

1. Storage → Create bucket
2. Name: `resumes`
3. Public: ✅

#### 3.4 Настройте Auth

1. Authentication → Settings
2. Site URL: `http://localhost:3000`
3. Redirect URLs: `http://localhost:3000/auth/callback`

#### 3.5 Получите API ключи

Settings → API:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Получите DeepSeek API ключ

У вас уже есть ключ: `sk-8e5ea4aa5d7b4db89961ed4113a52952`

Проверьте что он работает:
```bash
curl https://api.deepseek.com/v1/models \
  -H "Authorization: Bearer sk-8e5ea4aa5d7b4db89961ed4113a52952"
```

### 5. Настройте Resend (опционально)

1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Создайте API ключ
3. Для разработки можно использовать: `onboarding@resend.dev`

### 6. Создайте .env.local

```bash
cp env.example .env.local
```

Заполните файл `.env.local`:

```env
# Supabase (из шага 3.5)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# DeepSeek
DEEPSEEK_API_KEY=sk-8e5ea4aa5d7b4db89961ed4113a52952
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Resend
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Security (сгенерируйте)
NEXTAUTH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
```

### 7. Запустите приложение

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### 8. Тестирование

1. **Главная страница** → должна загрузиться
2. **Загрузите резюме** → `/upload`
   - Используйте тестовый PDF/DOCX файл
   - Дайте согласие на обработку
   - Дождитесь завершения обработки
3. **Зарегистрируйтесь** → `/register`
   - Введите email
   - Получите magic link
   - Перейдите по ссылке
4. **Dashboard** → `/dashboard`
   - Попробуйте AI чат
   - Сделайте поиск

### 9. Создайте админа

После регистрации, в Supabase SQL Editor:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

Теперь можете зайти в `/admin`

## 📝 Деплой на Vercel

### 1. Создайте GitHub репозиторий

```bash
cd /Users/dmitrybuylov/Desktop/unte_ve
git init
git add .
git commit -m "Initial commit: AI Recruiting Platform"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 2. Подключите к Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Import Git Repository
3. Выберите ваш репозиторий
4. Добавьте Environment Variables (все из `.env.local`)
5. Deploy!

### 3. Обновите Supabase настройки

После деплоя:
1. Получите URL: `https://your-app.vercel.app`
2. В Supabase Auth Settings:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

## 🎯 Что делать дальше

### Приоритет 1: Базовый функционал

- [ ] Протестируйте все основные сценарии
- [ ] Загрузите несколько тестовых резюме
- [ ] Проверьте поиск работает корректно
- [ ] Убедитесь что подписки работают

### Приоритет 2: Улучшения UX

- [ ] Добавьте сохранение избранных кандидатов (API готов, нужен UI)
- [ ] Реализуйте экспорт в Excel/CSV
- [ ] Добавьте историю поисков с возможностью повтора
- [ ] Улучшите мобильную версию

### Приоритет 3: Расширенные функции

- [ ] Интеграция с ЮKassa для реальных платежей
- [ ] Email-уведомления о новых кандидатах
- [ ] Полноценная админ-панель с графиками
- [ ] Массовая загрузка резюме для админа

### Приоритет 4: Оптимизация

- [ ] Добавьте кэширование embeddings
- [ ] Настройте мониторинг (Sentry)
- [ ] Добавьте rate limiting
- [ ] Оптимизируйте векторные индексы когда база вырастет

## 📚 Полезные команды

```bash
# Разработка
npm run dev           # Запуск dev сервера
npm run build         # Сборка для production
npm run start         # Запуск production сборки
npm run lint          # Проверка кода
npm run type-check    # Проверка типов
npm run format        # Форматирование кода

# Git
git status            # Проверить изменения
git add .             # Добавить все файлы
git commit -m "..."   # Создать коммит
git push              # Отправить на GitHub
```

## 🐛 Troubleshooting

### Проблема: npm не установлен

```bash
# Установите Node.js с https://nodejs.org
# Или через Homebrew (macOS):
brew install node
```

### Проблема: Module not found

```bash
rm -rf node_modules package-lock.json
npm install
```

### Проблема: Supabase connection error

- Проверьте URL и ключи в `.env.local`
- Убедитесь что RLS политики применены
- Проверьте что расширения включены

### Проблема: DeepSeek API error

- Проверьте API ключ
- Проверьте лимиты на аккаунте DeepSeek
- Проверьте network доступ к api.deepseek.com

### Проблема: Резюме не парсится

- Убедитесь что `pdf-parse` установлен
- Проверьте формат файла (PDF должен быть с текстом, не отсканированный)
- Проверьте логи в терминале

## 📞 Поддержка

- **Документация**: См. `docs/SETUP.md` для подробных инструкций
- **Архитектура**: См. `docs/ARCHITECTURE.md`
- **GitHub Issues**: Создайте issue если нашли баг

## 🎉 Поздравляем!

Вы готовы к запуску AI Рекрутинг Платформы! 

Начните с шага 1 и следуйте инструкциям по порядку. Удачи! 🚀

