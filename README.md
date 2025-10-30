# 🚀 Unte - AI Рекрутинг Платформа

Умная платформа для поиска кандидатов с помощью искусственного интеллекта.

## ✨ Основные возможности

- **📄 Загрузка резюме**: PDF, DOCX, TXT файлы
- **🤖 AI парсинг**: DeepSeek для извлечения структурированных данных
- **🔍 Семантический поиск**: Jina AI для поиска по смыслу
- **💬 AI чат**: Интеллектуальный ассистент для рекрутеров
- **📊 Аналитика**: Статистика и отчеты
- **🔐 Безопасность**: GDPR compliance, автоматическое удаление данных

## 🛠 Технологический стек

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Components
- **База данных**: Supabase (PostgreSQL + pgvector)
- **AI сервисы**: DeepSeek (парсинг + чат), Jina AI (embeddings)
- **Хранение**: Supabase Storage
- **Деплой**: Vercel

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/your-username/unte.git
cd unte
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка окружения
```bash
cp env.example .env.local
```

Заполните переменные в `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Jina AI API
JINA_API_KEY=your_jina_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug
```

### 4. Настройка базы данных
```bash
# Применение миграций
node scripts/apply-migrations.js
```

### 5. Запуск проекта
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📁 Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── (auth)/            # Страницы авторизации
│   ├── (protected)/       # Защищенные страницы
│   └── (public)/          # Публичные страницы
├── components/            # React компоненты
├── lib/                   # Утилиты и сервисы
│   ├── deepseek/         # DeepSeek AI интеграция
│   ├── jina/             # Jina AI интеграция
│   ├── supabase/         # Supabase клиенты
│   └── storage/          # Обработка файлов
└── types/                # TypeScript типы
```

## 🔧 API Endpoints

### Публичные
- `GET /api/health` - Проверка здоровья системы
- `POST /api/resumes/upload` - Загрузка резюме

### Защищенные (требуют авторизации)
- `POST /api/search/semantic` - Семантический поиск (pgvector RPC)
- `POST /api/search/chat` - AI чат
- `POST /api/search/text` - Текстовый поиск

## 🧪 Тестирование

### Тест парсинга резюме
```bash
curl -X GET http://localhost:3000/api/test-parsing
```

### Тест Jina AI
```bash
curl -X GET http://localhost:3000/api/test-jina
```

### Тест загрузки резюме
```bash
curl -X POST http://localhost:3000/api/resumes/upload \
  -F "file=@test_resume.txt" \
  -F "consent=true"
```

## 📊 Текущий статус

### ✅ Работает
- Загрузка и парсинг резюме (PDF, DOCX, TXT)
- Интеграции DeepSeek (чат/парсинг) и Jina AI (эмбеддинги)
- Векторный поиск: pgvector RPC `match_resumes`
- Supabase (БД, Storage, RLS)
- Извлечение ключевых полей (навыки/опыт/сводка)

### 🔄 В разработке
- Экспорт в Excel/CSV
- Система платежей и квоты
- Расписания для авто-очистки данных

## 🗄 База данных

### Основные таблицы
- `profiles` - Профили пользователей
- `resumes` - Резюме кандидатов
- `resume_summaries` - Краткие данные резюме
- `searches` - История поисков
- `search_results` - Результаты поиска
- `saved_candidates` - Избранные кандидаты

### Миграции
Все миграции находятся в `supabase/migrations/` и применяются автоматически.

## 🔐 Безопасность

- Row Level Security (RLS) в Supabase
- Валидация входных данных
- Очистка просроченных данных: функция `purge_expired_resumes()` (запуск через расписание/cron)
- Базовая защита от XSS (безопасный вывод чата)

## 📈 Мониторинг

- Health check endpoint
- Минимальный логгер с уровнями (debug/info/warn/error)

## 🤝 Разработка

### Workflow
1. Создайте feature ветку: `git checkout -b feature/new-feature`
2. Внесите изменения
3. Создайте Pull Request
4. После ревью - merge в `develop`

### Тестирование
```bash
npm run test        # Запуск тестов
npm run lint        # Проверка кода
npm run type-check  # Проверка типов
```

## 📝 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🆘 Поддержка

Если у вас есть вопросы или проблемы:
1. Проверьте [Issues](https://github.com/your-username/unte/issues)
2. Создайте новый Issue
3. Свяжитесь с командой разработки:
   - Телефон: +7 912 581 24 70
   - Email: buylovda@gmail.com
   - Telegram: @meetieru

---

**Версия**: 1.2.0  
**Последнее обновление**: 2025-10-29