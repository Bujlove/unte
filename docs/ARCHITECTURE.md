# Архитектура Unte

Техническая архитектура AI-платформы для рекрутинга.

## 🏗 Общая архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel CDN    │    │   Supabase      │    │   DeepSeek API  │
│   (Static)      │    │   (Database)    │    │   (AI)          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎨 Frontend (Next.js 14)

### App Router структура
```
src/app/
├── (auth)/              # Группа авторизации
│   ├── login/          # Страница входа
│   └── register/       # Страница регистрации
├── (protected)/         # Защищенные страницы
│   ├── dashboard/      # Главная панель
│   ├── search/         # Поиск и история
│   ├── candidates/     # Управление кандидатами
│   └── settings/       # Настройки пользователя
├── (public)/           # Публичные страницы
│   ├── upload/         # Загрузка резюме
│   └── pricing/        # Тарифы
└── api/                # API маршруты
    ├── resumes/        # Обработка резюме
    ├── search/         # Поиск кандидатов
    └── auth/           # Авторизация
```

### Компоненты
- **Server Components** - для статического контента
- **Client Components** - для интерактивности
- **shadcn/ui** - переиспользуемые UI компоненты
- **Tailwind CSS** - стилизация

## 🗄 База данных (Supabase)

### Схема таблиц
```sql
-- Пользователи и профили
profiles (id, email, full_name, subscription_type, ...)

-- Команды (будущая функция)
teams (id, name, owner_id, ...)

-- Резюме кандидатов
resumes (id, user_id, file_path, parsed_data, embedding, ...)

-- Поисковые запросы
searches (id, user_id, query, filters, results_count, ...)

-- Результаты поиска
search_results (id, search_id, resume_id, relevance_score, ...)

-- Избранные кандидаты
saved_candidates (id, user_id, resume_id, ...)

-- Платежи
payments (id, user_id, amount, status, ...)

-- Аудит логи
audit_logs (id, user_id, action, details, ...)
```

### Индексы
- **pgvector** - для семантического поиска
- **B-tree** - для обычных запросов
- **GIN** - для полнотекстового поиска

### RLS (Row Level Security)
- Пользователи видят только свои данные
- Админы имеют доступ ко всем данным
- Публичный доступ только к загрузке резюме

## 🤖 AI интеграция (DeepSeek)

### Парсинг резюме
```typescript
interface ParsedResume {
  fullName: string;
  email: string;
  phone: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  // ... другие поля
}
```

### Семантический поиск
1. **Embedding** - преобразование текста в векторы
2. **Similarity** - поиск похожих векторов
3. **Ranking** - ранжирование по релевантности

### AI Чат
- **Context-aware** - помнит историю диалога
- **Sequential questions** - задает вопросы по одному
- **Requirements extraction** - извлекает требования

## 🔐 Авторизация

### Supabase Auth
- **Magic Link** - вход по email
- **Google OAuth** - быстрая регистрация
- **JWT токены** - безопасная аутентификация

### Middleware
```typescript
// Защита маршрутов
export function middleware(request: NextRequest) {
  // Проверка авторизации
  // Редирект на логин
}
```

## 📁 Файловая система

### Supabase Storage
- **Bucket**: `resumes`
- **Политики**: только авторизованные пользователи
- **Форматы**: PDF, DOCX, DOC, TXT
- **Лимит**: 10MB на файл

### Обработка файлов
1. **Валидация** - проверка типа и размера
2. **Парсинг** - извлечение текста
3. **AI анализ** - структурирование данных
4. **Embedding** - создание векторов
5. **Сохранение** - в базу данных

## 🔄 API маршруты

### REST API
```
POST /api/resumes/upload     # Загрузка резюме
POST /api/search/semantic    # Семантический поиск
POST /api/search/chat        # AI чат
GET  /api/health            # Проверка здоровья
```

### Обработка ошибок
- **Валидация** - Zod схемы
- **Rate limiting** - защита от спама
- **Error handling** - структурированные ошибки

## 🚀 Деплой и инфраструктура

### Vercel
- **Edge Functions** - для API маршрутов
- **Static Generation** - для статических страниц
- **CDN** - глобальная доставка контента

### Мониторинг
- **Vercel Analytics** - метрики производительности
- **Supabase Dashboard** - мониторинг БД
- **Error tracking** - отслеживание ошибок

## 🔒 Безопасность

### Frontend
- **CSP** - Content Security Policy
- **HTTPS** - принудительное шифрование
- **Input validation** - валидация пользовательского ввода

### Backend
- **RLS** - Row Level Security в БД
- **JWT** - безопасные токены
- **Rate limiting** - защита от DDoS

### Данные
- **Шифрование** - чувствительные данные
- **GDPR** - соответствие требованиям
- **Auto-deletion** - автоматическое удаление

## 📊 Производительность

### Оптимизации
- **Server Components** - меньше JavaScript
- **Image optimization** - оптимизация изображений
- **Code splitting** - разделение кода
- **Caching** - кэширование запросов

### Масштабирование
- **Database indexes** - оптимизация запросов
- **Connection pooling** - пул соединений
- **CDN** - кэширование статики

## 🔧 Разработка

### Workflow
- **Git Flow** - ветки main/develop
- **GitHub Actions** - CI/CD
- **Code review** - проверка кода
- **Testing** - автоматические тесты

### Инструменты
- **TypeScript** - типизация
- **ESLint** - линтинг
- **Prettier** - форматирование
- **Tailwind** - стилизация

---

Архитектура спроектирована для масштабируемости, безопасности и производительности.