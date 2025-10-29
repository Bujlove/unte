# 🤖 Unte - AI Рекрутинг Платформа

**Умный поиск кандидатов с помощью искусственного интеллекта**

Unte - production-ready сервис для рекрутинга на базе DeepSeek API с семантическим поиском и AI-ассистентом.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek-orange)](https://deepseek.com/)

## ✨ Основные функции

### 🔍 Для рекрутеров
- **AI-ассистент** - умный чат для формулирования требований к кандидатам
- **Семантический поиск** - поиск по смыслу, а не только по ключевым словам
- **История поиска** - сохранение и продолжение предыдущих запросов
- **Избранные кандидаты** - сохранение понравившихся профилей
- **Экспорт данных** - выгрузка результатов в Excel/CSV

### 📄 Для соискателей
- **Загрузка резюме** - поддержка PDF, DOCX, DOC, TXT
- **AI-анализ** - автоматическое извлечение навыков и опыта
- **Статус обработки** - отслеживание процесса анализа
- **GDPR-совместимость** - автоматическое удаление через 180 дней

### 🔐 Авторизация
- **Magic Link** - вход по email без пароля
- **Google OAuth** - быстрая регистрация через Google
- **Безопасность** - Row Level Security в Supabase

## 🛠 Технологии

- **Frontend/Backend**: Next.js 14 (App Router, TypeScript, Server Components)
- **База данных**: Supabase (PostgreSQL + pgvector)
- **AI**: DeepSeek API (парсинг резюме и семантический поиск)
- **Стилизация**: Tailwind CSS + shadcn/ui
- **Деплой**: Vercel

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/Bujlove/unte.git
cd unte
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
```bash
cp .env.local.example .env.local
```

Заполните переменные в `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# DeepSeek API
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

### 4. Настройка базы данных
Выполните миграции в Supabase SQL Editor:
1. `supabase/migrations/001_init_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions.sql`

### 5. Запуск в режиме разработки
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📁 Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Страницы авторизации
│   ├── (protected)/       # Защищенные страницы
│   ├── (public)/          # Публичные страницы
│   └── api/               # API маршруты
├── components/            # React компоненты
├── lib/                   # Утилиты и конфигурация
│   ├── deepseek/         # DeepSeek API интеграция
│   └── supabase/         # Supabase клиенты
└── types/                 # TypeScript типы
```

## 🔄 Workflow разработки

Проект использует Git Flow с ветками:
- **`main`** - стабильная продакшн ветка
- **`develop`** - ветка разработки
- **`feature/*`** - ветки для новых функций

Подробнее в [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)

## 📋 Доступные команды

```bash
# Разработка
npm run dev              # Запуск в режиме разработки
npm run build            # Сборка для продакшна
npm run start            # Запуск продакшн сборки

# Проверки
npm run lint             # ESLint проверка
npm run type-check       # TypeScript проверка
npm run check-all        # Все проверки

# Git workflow
npm run new-feature      # Создать новую ветку функции
npm run merge-to-main    # Слить develop в main
```

## 🌐 Деплой

### Vercel (рекомендуется)
1. Подключите репозиторий к Vercel
2. Настройте переменные окружения
3. Автоматический деплой при push в main

### Ручной деплой
```bash
npm run build
npm run start
```

## 📚 Документация

- [Архитектура](./docs/ARCHITECTURE.md) - техническая архитектура
- [Настройка](./docs/SETUP.md) - подробная настройка
- [Workflow](./DEVELOPMENT_WORKFLOW.md) - процесс разработки
- [История версий](./VERSION_HISTORY.md) - изменения по версиям

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для функции (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 📞 Поддержка

Если у вас есть вопросы или проблемы:
1. Проверьте [Issues](https://github.com/Bujlove/unte/issues)
2. Создайте новый Issue с подробным описанием
3. Свяжитесь с командой разработки

---

**Unte** - делаем рекрутинг умнее с помощью AI 🚀