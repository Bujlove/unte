# Архитектура AI Рекрутинг Платформы

## Обзор

AI Рекрутинг Платформа - это full-stack веб-приложение для поиска кандидатов с использованием искусственного интеллекта.

### Технологический стек

- **Frontend & Backend**: Next.js 14 (App Router, Server Components)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase) с pgvector
- **AI**: DeepSeek API
- **Styling**: Tailwind CSS + Radix UI
- **Email**: Resend
- **Storage**: Supabase Storage
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Архитектура высокого уровня

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────┐
│      Next.js Application        │
│  ┌─────────────────────────┐   │
│  │   Client Components      │   │
│  │   (Interactive UI)       │   │
│  └──────────┬──────────────┘   │
│             │                    │
│  ┌──────────↓──────────────┐   │
│  │   Server Components      │   │
│  │   (Data Fetching)        │   │
│  └──────────┬──────────────┘   │
│             │                    │
│  ┌──────────↓──────────────┐   │
│  │   API Routes             │   │
│  │   (Business Logic)       │   │
│  └──────────┬──────────────┘   │
└─────────────┼───────────────────┘
              │
   ┌──────────┴──────────┐
   │                     │
   ↓                     ↓
┌──────────┐      ┌─────────────┐
│ Supabase │      │  DeepSeek   │
│  (DB +   │      │  API (AI)   │
│  Auth +  │      └─────────────┘
│ Storage) │
└──────────┘
```

## Структура проекта

```
src/
├── app/                      # Next.js App Router
│   ├── (public)/            # Публичные страницы
│   │   ├── page.tsx         # Лендинг
│   │   ├── upload/          # Загрузка резюме
│   │   └── pricing/         # Тарифы
│   ├── (auth)/              # Авторизация
│   │   ├── login/
│   │   └── register/
│   ├── (protected)/         # Защищенные страницы
│   │   ├── dashboard/       # Главная страница рекрутера
│   │   ├── candidates/      # Просмотр кандидатов
│   │   ├── settings/        # Настройки
│   │   └── billing/         # Подписка
│   ├── admin/               # Админ-панель
│   ├── api/                 # API endpoints
│   │   ├── auth/           # Авторизация
│   │   ├── resumes/        # Работа с резюме
│   │   └── search/         # Поиск
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Глобальные стили
├── components/              # React компоненты
│   ├── ui/                 # UI компоненты (Radix)
│   ├── layout/             # Layout компоненты
│   └── ...                 # Функциональные компоненты
├── lib/                    # Библиотеки и утилиты
│   ├── supabase/          # Supabase клиенты
│   ├── deepseek/          # DeepSeek AI функции
│   ├── resend/            # Email шаблоны
│   └── utils.ts           # Общие утилиты
├── types/                  # TypeScript типы
│   ├── database.ts        # Типы БД
│   ├── resume.ts          # Типы резюме
│   └── billing.ts         # Типы подписок
└── middleware.ts           # Next.js middleware
```

## Ключевые компоненты

### 1. Аутентификация

**Технология**: Supabase Auth

**Поток**:
```
User → Email Input → Supabase Auth → Magic Link Email → 
Email Click → Auth Callback → Dashboard
```

**Файлы**:
- `middleware.ts` - Защита роутов
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client
- `app/(auth)/login/page.tsx` - UI

### 2. Обработка резюме

**Поток**:
```
File Upload → Text Extraction → AI Parsing → 
Embedding Generation → Database Storage
```

**Компоненты**:
- **Text Extraction**: `lib/storage/file-parser.ts`
  - PDF: pdf-parse
  - DOCX: mammoth
  - TXT: native
  
- **AI Parsing**: `lib/deepseek/parser.ts`
  - Структурирование данных
  - Извлечение навыков
  - Оценка качества
  
- **Embeddings**: `lib/deepseek/embeddings.ts`
  - Генерация векторов (1536 размерность)
  - Хранение в pgvector

- **Storage**: Supabase Storage
  - Хранение оригинальных файлов
  - Публичные URLs

### 3. Семантический поиск

**Поток**:
```
User Query → AI Chat → Requirements Extraction → 
Embedding Generation → Vector Search → Results Ranking
```

**Технологии**:
- **pgvector**: Cosine similarity search
- **DeepSeek**: Query understanding
- **PostgreSQL**: Filtering and ranking

**Алгоритм**:
1. Пользователь описывает требования в чате
2. AI извлекает структурированные требования
3. Генерируется embedding поискового запроса
4. Выполняется векторный поиск в БД
5. Применяются дополнительные фильтры
6. Результаты ранжируются по relevance score

**Файлы**:
- `lib/deepseek/chat.ts` - AI ассистент
- `lib/deepseek/search.ts` - Поисковый движок
- `app/api/search/semantic/route.ts` - API endpoint

### 4. База данных

**Схема**:

```sql
profiles (users)
  ├── subscription info
  ├── search quota
  └── team_id (future)

resumes
  ├── file metadata
  ├── parsed data (JSONB)
  ├── skills array
  ├── embedding (vector 1536)
  └── summary_embedding (vector 1536)

searches
  ├── user_id
  ├── query text
  ├── filters (JSONB)
  └── results_count

search_results
  ├── search_id
  ├── resume_id
  └── relevance_score

saved_candidates
  ├── user_id
  ├── resume_id
  ├── notes
  └── status
```

**Индексы**:
- `ivfflat` на embedding колонки (для vector search)
- `GIN` на skills массивы (для текстового поиска)
- Standard B-tree на foreign keys

**RLS (Row Level Security)**:
- Users видят только свои данные
- Admins видят все
- Public может загружать резюме
- Resumes видны только authenticated recruiters

### 5. AI Интеграция

**DeepSeek API** используется для:

1. **Парсинг резюме**:
   - Модель: `deepseek-chat`
   - Temperature: 0.3 (низкая для точности)
   - JSON mode: включен
   - Извлечение: контакты, опыт, навыки, образование

2. **Генерация embeddings**:
   - Модель: `deepseek-embed`
   - Размерность: 1536
   - Используется для: резюме и поисковые запросы

3. **Чат-ассистент**:
   - Модель: `deepseek-chat`
   - Temperature: 0.7 (для естественности)
   - Streaming: да (для real-time UI)
   - Контекст: вся история чата

### 6. Подписки и биллинг

**Модель**:
- **Trial**: 10 поисков, 7 дней, бесплатно
- **Start**: 100 поисков/месяц, ₽5,900
- **Pro**: Unlimited, ₽14,900

**Логика**:
```typescript
// В БД функция can_user_search()
if (subscription_status !== 'active') return false;
if (trial_expired) return false;
if (subscription_expired) return false;
if (searches_count >= limit && type !== 'pro') return false;
return true;
```

**Интеграция с ЮKassa** (подготовлено):
- Webhook endpoints созданы
- Payment table готова
- UI для upgrade/downgrade готов

## Data Flow

### Загрузка резюме

```
1. User uploads file (PDF/DOCX)
   ↓
2. File validation (size, type)
   ↓
3. Text extraction
   ↓
4. AI parsing (DeepSeek)
   ↓
5. Skills extraction
   ↓
6. Embedding generation (2 vectors)
   ↓
7. Quality scoring
   ↓
8. Duplicate check (by email/phone)
   ↓
9. File upload to Storage
   ↓
10. Database insert
    ↓
11. Return upload_token (for updates)
```

### Поиск кандидатов

```
1. User describes requirements in chat
   ↓
2. AI extracts structured requirements
   ↓
3. Check search quota
   ↓
4. Generate query embedding
   ↓
5. Vector search in PostgreSQL
   ↓
6. Apply filters (skills, experience, location)
   ↓
7. Rank results
   ↓
8. Save search to history
   ↓
9. Increment search counter
   ↓
10. Return results to UI
```

## Security

### Аутентификация
- Magic Link (OTP)
- JWT tokens в httpOnly cookies
- Session management via Supabase

### Авторизация
- Middleware проверка на каждом запросе
- RLS в базе данных
- Role-based access (recruiter, admin)

### Защита данных
- Environment variables для секретов
- Encrypted connections (HTTPS)
- GDPR compliance (consent, auto-deletion)
- Secure file storage

### API Security
- Rate limiting (prepared)
- Input validation (Zod)
- CORS configuration
- Security headers

## Performance

### Оптимизации

1. **Database**:
   - Векторные индексы для быстрого поиска
   - Connection pooling
   - Prepared statements

2. **Frontend**:
   - Server Components (меньше JS)
   - Code splitting
   - Image optimization
   - Lazy loading

3. **Caching**:
   - Static page caching на Vercel
   - API route caching (when applicable)

4. **Edge Computing**:
   - Middleware на Edge
   - CDN для статики

## Масштабируемость

### Текущая архитектура поддерживает:
- 1000+ одновременных пользователей
- 100k+ резюме в базе
- Sub-second поисковые запросы

### Для масштабирования:
1. **Database**: Supabase Pro с репликацией
2. **Search**: Выделенный vector search сервис
3. **AI**: Кэширование embeddings
4. **Storage**: CDN для файлов

## Мониторинг

### Метрики
- Vercel Analytics (Core Web Vitals)
- Supabase Dashboard (DB performance)
- Health check endpoint

### Логирование
- Audit logs в БД
- Error tracking (Sentry ready)
- API request logs

## Deployment

### Development
```bash
npm run dev  # Local development
```

### Staging
```bash
git push origin develop  # Auto-deploy to preview
```

### Production
```bash
git push origin main  # Auto-deploy to production
```

### Environment Variables
- Development: `.env.local`
- Staging: Vercel Preview
- Production: Vercel Production

## Future Enhancements

### Planned Architecture Changes

1. **Microservices**:
   - Отдельный сервис для AI обработки
   - Queue система для async tasks
   
2. **Real-time**:
   - WebSockets для live updates
   - Supabase Realtime subscriptions

3. **Advanced Search**:
   - Elasticsearch для full-text search
   - Hybrid search (vector + keyword)

4. **Mobile**:
   - React Native app
   - Shared API layer

## Conventions

### Code Style
- TypeScript strict mode
- Functional components
- ESLint + Prettier
- Conventional commits

### File Naming
- Components: PascalCase
- Files: kebab-case
- API routes: lowercase

### Git Workflow
- main: production
- develop: staging
- feature/: new features
- fix/: bug fixes

## Documentation

- **README.md**: Quick start
- **SETUP.md**: Detailed deployment guide
- **ARCHITECTURE.md**: This file
- **CHANGELOG.md**: Version history
- **CONTRIBUTING.md**: Contribution guidelines

