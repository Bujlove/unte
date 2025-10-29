# 🚀 Деплой Unte на Vercel

## Шаг 1: Подготовка GitHub репозитория

```bash
# Инициализируйте Git (если еще не сделано)
git init

# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit: Unte AI Recruiting Platform"

# Создайте репозиторий на GitHub и свяжите его
git remote add origin https://github.com/your-username/unte.git
git branch -M main
git push -u origin main
```

## Шаг 2: Настройка Vercel

1. Перейдите на [vercel.com](https://vercel.com) и войдите через GitHub
2. Нажмите **"Add New Project"**
3. Импортируйте ваш GitHub репозиторий `unte`
4. В настройках проекта:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (по умолчанию)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

## Шаг 3: Настройка Environment Variables

В настройках проекта Vercel добавьте следующие переменные окружения:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://ghluoqegmbeqpatatkes.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:Mitya24012000!@db.ghluoqegmbeqpatatkes.supabase.co:5432/postgres
```

### DeepSeek API
```
DEEPSEEK_API_KEY=sk-8e5ea4aa5d7b4db89961ed4113a52952
DEEPSEEK_API_URL=https://api.deepseek.com
```

### Next.js
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

⚠️ **Важно**: Замените `your-domain.vercel.app` на реальный домен после деплоя!

## Шаг 4: Обновление Supabase Auth URLs

После первого деплоя обновите в Supabase Dashboard:

1. Перейдите в **Authentication → URL Configuration**
2. Добавьте ваш Vercel домен в:
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: 
     - `https://your-domain.vercel.app/auth/callback`
     - `https://your-domain.vercel.app/dashboard`

## Шаг 5: Deploy!

После настройки всех переменных:

1. Нажмите **"Deploy"** в Vercel
2. Дождитесь завершения сборки (2-3 минуты)
3. Ваш сайт будет доступен по адресу `https://your-project.vercel.app`

## 🎯 Проверка после деплоя

1. ✅ Главная страница загружается
2. ✅ Логотип Unte отображается
3. ✅ Регистрация работает (Magic Link)
4. ✅ Вход в систему работает
5. ✅ Загрузка резюме работает
6. ✅ AI поиск в дашборде работает

## 🔄 Автоматические деплои

После настройки каждый push в ветку `main` будет автоматически деплоиться на production.

## 🌐 Кастомный домен (опционально)

1. В Vercel: Settings → Domains
2. Добавьте ваш домен (например, `unte.ru`)
3. Настройте DNS записи у вашего регистратора
4. Обновите `NEXT_PUBLIC_APP_URL` в environment variables

## 📊 Мониторинг

После деплоя доступны:
- **Vercel Analytics**: автоматически включена
- **Logs**: доступны в Vercel Dashboard
- **Supabase Logs**: в Supabase Dashboard

---

## 🆘 Troubleshooting

### Ошибка сборки
```bash
# Проверьте локально перед деплоем
npm run build
```

### Email не приходят
- Убедитесь, что в Supabase настроены Auth URLs
- Проверьте Supabase → Authentication → Email Templates

### 500 ошибки
- Проверьте логи в Vercel Dashboard
- Убедитесь, что все environment variables заданы правильно

### База данных не доступна
- Проверьте `DATABASE_URL` в Vercel
- Убедитесь, что миграции выполнены в Supabase

---

🎉 **Готово!** Ваша платформа Unte теперь доступна онлайн!

