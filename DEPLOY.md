# Деплой Unte

Руководство по развертыванию платформы Unte на различных платформах.

## 🚀 Vercel (Рекомендуется)

### 1. Подготовка
- Аккаунт на [Vercel](https://vercel.com)
- Репозиторий на GitHub
- Настроенные переменные окружения

### 2. Подключение репозитория
1. Войдите в Vercel Dashboard
2. Нажмите "New Project"
3. Выберите репозиторий `Bujlove/unte`
4. Vercel автоматически определит Next.js

### 3. Настройка переменных окружения
В настройках проекта добавьте:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

### 4. Настройка базы данных
1. Выполните миграции в Supabase SQL Editor:
   - `001_init_schema.sql`
   - `002_rls_policies.sql`
   - `003_functions.sql`

2. Настройте Google OAuth в Supabase:
   - Authentication → Providers → Google
   - Добавьте Client ID и Client Secret

### 5. Деплой
- **Production**: автоматический при push в `main`
- **Preview**: автоматический при push в `develop`

## 🐳 Docker

### 1. Создание Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Сборка и запуск
```bash
# Сборка образа
docker build -t unte .

# Запуск контейнера
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e DEEPSEEK_API_KEY=your-key \
  unte
```

## ☁️ Другие платформы

### Netlify
1. Подключите репозиторий
2. Настройте build command: `npm run build`
3. Настройте publish directory: `.next`
4. Добавьте переменные окружения

### Railway
1. Подключите GitHub репозиторий
2. Выберите Next.js шаблон
3. Настройте переменные окружения
4. Деплой автоматический

### AWS Amplify
1. Подключите репозиторий
2. Настройте build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```

## 🔧 Настройка окружения

### Переменные окружения
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# DeepSeek API
DEEPSEEK_API_KEY=sk-your-deepseek-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Next.js
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
```

### Supabase настройка
1. **База данных**:
   - Выполните миграции
   - Настройте RLS политики
   - Создайте индексы

2. **Storage**:
   - Включите Storage
   - Настройте bucket для резюме
   - Установите политики доступа

3. **Auth**:
   - Настройте провайдеры (Magic Link, Google)
   - Добавьте redirect URLs
   - Настройте email templates

## 📊 Мониторинг

### Vercel Analytics
- Автоматически включен
- Метрики производительности
- Ошибки и исключения

### Supabase Dashboard
- Мониторинг базы данных
- Логи запросов
- Использование ресурсов

### Sentry (опционально)
```bash
npm install @sentry/nextjs
```

## 🔄 CI/CD

### GitHub Actions
Проект настроен с автоматическими workflow:
- **Lint & Type Check** - при каждом PR
- **Deploy Preview** - при push в develop
- **Deploy Production** - при push в main

### Ручной деплой
```bash
# Сборка
npm run build

# Проверка
npm run check-all

# Деплой (зависит от платформы)
vercel --prod
```

## 🚨 Troubleshooting

### Частые проблемы

1. **Ошибка сборки**:
   - Проверьте переменные окружения
   - Убедитесь в корректности TypeScript
   - Проверьте зависимости

2. **Ошибки базы данных**:
   - Проверьте подключение к Supabase
   - Убедитесь в выполнении миграций
   - Проверьте RLS политики

3. **Проблемы с AI**:
   - Проверьте DeepSeek API ключ
   - Убедитесь в корректности URL
   - Проверьте лимиты API

### Логи
```bash
# Vercel
vercel logs

# Docker
docker logs container-name

# Локально
npm run dev
```

## 📈 Оптимизация

### Performance
- Используйте Server Components
- Оптимизируйте изображения
- Настройте кэширование

### SEO
- Настройте мета-теги
- Добавьте sitemap.xml
- Настройте robots.txt

### Безопасность
- Используйте HTTPS
- Настройте CORS
- Регулярно обновляйте зависимости

---

Для вопросов по деплою создайте Issue в репозитории.