# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-01

### Added

#### Infrastructure
- Next.js 14 setup with TypeScript and App Router
- Tailwind CSS configuration with custom primary color (#098936)
- ESLint and Prettier configuration
- Environment variables setup

#### Database
- Supabase integration with pgvector extension
- Complete database schema:
  - profiles table with subscription management
  - resumes table with vector embeddings
  - searches and search_results tables
  - saved_candidates table
  - payments table (prepared for YooKassa)
  - audit_logs table
  - teams table (prepared for future use)
- Row Level Security (RLS) policies
- Database functions and triggers
- Automated profile creation on user signup

#### Authentication
- Magic Link authentication via Supabase Auth
- Email templates with Resend integration
- Login and registration pages
- Protected route middleware
- User profile management
- Trial period logic (7 days, 10 searches)

#### Resume Processing
- Public resume upload page with drag & drop
- AI-powered resume parsing with DeepSeek
- Support for PDF, DOCX, DOC, TXT formats
- Text extraction from documents
- Structured data extraction:
  - Contact information
  - Professional summary
  - Skills (hard, soft, tools)
  - Work experience
  - Education
  - Languages
  - Certifications and projects
- Vector embeddings generation for semantic search
- Duplicate detection by email/phone
- Resume quality scoring
- GDPR compliance (consent, 180-day auto-deletion)
- Unique upload tokens for resume updates

#### AI Search
- AI chat assistant for recruiters
- Natural language requirement extraction
- Semantic search using pgvector cosine similarity
- Search filters:
  - Skills matching
  - Experience years
  - Location
  - Education level
- Match score calculation
- Search results ranking
- Search history and templates
- Search quota management per subscription

#### User Interface
- Modern, responsive design
- Landing page
- Dashboard with AI chat and search results
- Candidate detail pages
- Pricing page with subscription comparison
- Billing page with usage statistics
- Settings page
- Navigation with subscription status
- Loading states and progress bars

#### Subscription Management
- Three-tier pricing:
  - Trial: 10 searches, 7 days free
  - Start: 100 searches/month, ₽5,900/month
  - Pro: Unlimited searches, ₽14,900/month
- Trial period management
- Search quota tracking
- Subscription status display
- Prepared for YooKassa payment integration

#### Admin
- Admin role in database
- Admin middleware protection
- Basic admin dashboard with statistics
- Audit logs system
- Supabase Dashboard integration

#### SEO & Performance
- Meta tags and Open Graph
- Sitemap generation
- Robots.txt configuration
- Security headers
- Image optimization ready

#### Monitoring
- Health check endpoint
- Supabase connection monitoring
- Ready for Vercel Analytics
- Ready for Sentry integration

#### CI/CD
- GitHub Actions workflows:
  - Production deploy
  - Preview deploys
  - Lint and type checking
- Vercel configuration
- Environment variables documentation

#### Documentation
- Comprehensive README.md
- Detailed SETUP.md with step-by-step instructions
- Environment variables documentation
- Database schema documentation
- API endpoint structure
- Architecture prepared for extensions

### Prepared for Future Releases

- Teams and multi-user accounts (database ready)
- OAuth authentication with Google (structure ready)
- Extended email notifications (weekly digest, new candidates)
- Full admin panel with analytics
- YooKassa payment integration (endpoints ready)
- ATS system integrations via webhooks
- API keys for third-party integrations
- Bulk resume uploads for admins
- Candidate export to Excel/CSV
- Saved candidates management
- Search templates

## [Unreleased]

### Planned Features
- Full OAuth implementation (Google, LinkedIn)
- Real payment integration with YooKassa
- Complete admin panel with charts and analytics
- Email notification system
- Team collaboration features
- Advanced candidate filtering
- Candidate communication tools
- Integration marketplace
- Mobile app

