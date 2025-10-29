# 🚀 Руководство по развертыванию Unte на Vercel

## 📋 Предварительные требования

### 1. Аккаунты и сервисы
- ✅ GitHub репозиторий
- ✅ Vercel аккаунт
- ✅ Supabase проект
- ✅ DeepSeek API ключ
- ✅ Jina AI API ключ

### 2. Переменные окружения
Все переменные из `env.example` должны быть настроены в Vercel.

## 🔧 Пошаговое развертывание

### Шаг 1: Подготовка репозитория
```bash
# Убедитесь, что все изменения зафиксированы
git status
git push origin main --tags
```

### Шаг 2: Создание проекта в Vercel
1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите "New Project"
3. Импортируйте репозиторий из GitHub
4. Выберите папку проекта (если не корневая)

### Шаг 3: Настройка переменных окружения
В Vercel Dashboard → Settings → Environment Variables добавьте:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ghluoqegmbeqpatatkes.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobHVvcWVnbWJlcXBhdGF0a2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTg1NDIsImV4cCI6MjA3NzI5NDU0Mn0.1g4hnVTxyj9RRLFolH6Xc1Kqi2GqaWy_Vco-MJf9mjY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobHVvcWVnbWJlcXBhdGF0a2VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcxODU0MiwiZXhwIjoyMDc3Mjk0NTQyfQ.BBVLhG_l-sEs3gw_wgEyqKvz9E_sIxqIzjKkgvsAwOs

# DeepSeek API
DEEPSEEK_API_KEY=sk-8e5ea4aa5d7b4db89961ed4113a52952
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Jina AI API
JINA_API_KEY=jina_0c6a3e9d2bfa471294a48762d4aeb0b3xuIqZ5E5gTPoT0IyfE8kz2r3M2tX

# URLs
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api

# Security
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl
ENCRYPTION_KEY=your-encryption-key-32-characters
```

### Шаг 4: Настройка Supabase
1. Убедитесь, что миграции применены в Supabase Dashboard
2. Проверьте, что RLS политики настроены
3. Убедитесь, что Storage bucket "resumes" создан

### Шаг 5: Деплой
1. Нажмите "Deploy" в Vercel
2. Дождитесь завершения сборки
3. Проверьте, что деплой прошел успешно

## 🧪 Тестирование после деплоя

### 1. Проверка здоровья системы
```bash
curl https://your-app.vercel.app/api/health
```

### 2. Тест Jina AI
```bash
curl https://your-app.vercel.app/api/test-jina
```

### 3. Тест парсинга
```bash
curl https://your-app.vercel.app/api/test-parsing
```

### 4. Тест загрузки резюме
```bash
curl -X POST https://your-app.vercel.app/api/resumes/upload \
  -F "file=@test_resume.txt" \
  -F "consent=true"
```

## 🔧 Настройка домена (опционально)

1. В Vercel Dashboard → Settings → Domains
2. Добавьте ваш домен
3. Настройте DNS записи
4. Обновите переменные окружения с новым доменом

## 📊 Мониторинг

### 1. Vercel Analytics
- Автоматически включено
- Просмотр в Vercel Dashboard → Analytics

### 2. Логи
- Vercel Dashboard → Functions → View Function Logs
- Мониторинг ошибок и производительности

### 3. Supabase
- Supabase Dashboard → Logs
- Мониторинг запросов к БД

## 🚨 Устранение неполадок

### Проблема: Ошибка сборки
**Решение**: Проверьте переменные окружения и убедитесь, что все API ключи корректны

### Проблема: Ошибка подключения к БД
**Решение**: Проверьте Supabase URL и ключи, убедитесь что RLS настроен

### Проблема: AI сервисы не работают
**Решение**: Проверьте API ключи DeepSeek и Jina AI

## ✅ Чек-лист готовности

- [ ] Репозиторий синхронизирован с GitHub
- [ ] Все переменные окружения настроены в Vercel
- [ ] Supabase миграции применены
- [ ] Storage bucket создан
- [ ] Деплой прошел успешно
- [ ] Все тесты проходят
- [ ] Домен настроен (если нужен)

## 🎉 Готово!

После успешного деплоя ваш проект будет доступен по адресу:
`https://your-app.vercel.app`

**Версия**: 1.2.0  
**Статус**: Готов к продакшену 🚀
