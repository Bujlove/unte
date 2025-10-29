# Contributing to AI Recruiting Platform

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/ai-recruiting-platform.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see `env.example`)
5. Set up Supabase database (see `docs/SETUP.md`)
6. Run development server: `npm run dev`

## Development Workflow

### Branching Strategy

- `main` - Production branch (protected)
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `hotfix/*` - Urgent production fixes

### Making Changes

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our code standards

3. Test your changes:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request to `develop` branch

## Code Standards

### TypeScript

- Use TypeScript for all new files
- Avoid `any` types - use proper types or `unknown`
- Export types and interfaces when they might be reused

### React Components

- Use functional components with hooks
- Use Server Components by default (Next.js 14)
- Add `"use client"` directive only when necessary
- Keep components focused and small

### Naming Conventions

- **Files**: Use kebab-case for file names (`user-profile.tsx`)
- **Components**: Use PascalCase (`UserProfile`)
- **Functions**: Use camelCase (`getUserProfile`)
- **Constants**: Use UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: Use PascalCase (`UserProfile`, `ApiResponse`)

### Code Organization

```typescript
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Component
export default function Component({ title }: Props) {
  // 4. Hooks
  const [state, setState] = useState("");

  // 5. Functions
  const handleClick = () => {
    // ...
  };

  // 6. Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### Styling

- Use Tailwind CSS for styling
- Follow mobile-first approach
- Use semantic class names
- Extract repeated patterns into components

### Database

- Always use parameterized queries
- Follow RLS policies
- Add migrations for schema changes
- Test migrations before deploying

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add candidate export to Excel
fix: resolve search pagination issue
docs: update API documentation
refactor: simplify auth middleware
```

## Pull Request Process

1. **Update Documentation**: Update README.md if you're adding new features
2. **Add Tests**: If applicable, add tests for your changes
3. **Update CHANGELOG**: Add your changes to `CHANGELOG.md` under `[Unreleased]`
4. **Follow Template**: Use the PR template and fill in all sections
5. **Request Review**: Request review from maintainers
6. **Address Feedback**: Respond to review comments and make necessary changes

## Testing

### Manual Testing

1. Test on different browsers (Chrome, Firefox, Safari)
2. Test responsive design (mobile, tablet, desktop)
3. Test with different user roles (candidate, recruiter, admin)
4. Test edge cases and error scenarios

### Automated Testing (Future)

We plan to add automated testing:
- Unit tests with Jest
- Integration tests with Testing Library
- E2E tests with Playwright

## Code Review Guidelines

### For Authors

- Keep PRs focused and reasonably sized
- Provide context in PR description
- Add screenshots for UI changes
- Be responsive to feedback

### For Reviewers

- Be constructive and respectful
- Explain the "why" behind suggestions
- Approve or request changes clearly
- Test the changes locally if possible

## Common Tasks

### Adding a New API Route

1. Create file in `src/app/api/[route]/route.ts`
2. Add authentication check
3. Validate input with Zod
4. Implement business logic
5. Return proper status codes
6. Add error handling
7. Document in API docs

### Adding a New Database Table

1. Create migration file in `supabase/migrations/`
2. Define table schema
3. Add RLS policies
4. Add necessary indexes
5. Update types in `src/types/database.ts`
6. Test migration locally
7. Document the table

### Adding a New Component

1. Create component file
2. Add types for props
3. Implement component
4. Add to appropriate directory
5. Export if reusable
6. Use in parent component

## Security

- Never commit sensitive data (API keys, passwords)
- Always validate user input
- Use parameterized queries
- Follow OWASP guidelines
- Report security issues privately

## Need Help?

- Check existing issues
- Read documentation in `docs/`
- Ask in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Thank You!

Your contributions make this project better. We appreciate your time and effort! 🙏

