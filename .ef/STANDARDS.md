# Project Standards

> Codified conventions that all agents read and enforce. Created during `ef:init`, evolves via `ef:standards update`.

## Architecture

- **Pattern**: Standalone Angular application with provider-based configuration and routed feature areas.
- **File structure**: Prefer standalone, feature-oriented Angular areas.
- **Naming conventions**: Follow Angular style-guide naming and TypeScript conventions.
- **Module boundaries**: Keep timing ingestion, domain logic, persistence, and presentation concerns separate.

## API Standards

- **Style**: Not yet selected.
- **Versioning**: Not yet selected.
- **Error format**: Surface timing ingestion failures explicitly; do not return success-shaped fallbacks.
- **Pagination**: Not yet applicable.
- **Authentication**: Not yet selected.
- **Naming**: Use consistent domain terminology once the timing model is defined.

## Database

- **ORM**: Not yet selected.
- **Migration strategy**: Not yet selected.
- **Naming**: Not yet selected.
- **Conventions**: Timing records must have stable identities and enough source metadata to detect duplicates.

## Frontend / Design System

- **Framework**: Angular 22.1.7 (standalone).
- **Styling**: CSS.
- **Component library**: Not yet selected.
- **Design tokens**: Establish centrally when UI implementation begins.
- **Accessibility**: Use semantic HTML, keyboard-operable controls, and accessible status/error feedback.

## Tech Stack

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Frontend | Angular | 22.1.7 | Stakeholder requirement |
| CLI / Build | Angular CLI / `@angular/build` | 22.1.8 | Reproducible build and development tooling |
| Language | TypeScript | 6.0.3 | Strict type-safe Angular development |
| Unit tests | Angular unit-test builder + Vitest | Vitest 4.1.11 | Supported one-shot tests using jsdom 28.1.0 |
| Linting | angular-eslint / ESLint | 22.1.0 / 10.10.0 | TypeScript and Angular template linting |

## CI/CD

- **Pipeline**: Not yet configured.
- **Environments**: Not yet defined.
- **Deploy method**: Not yet defined.
- **Required checks**: `npm run lint`, `npm run test:ci`, and `npm run build`.
- **Branch strategy**: Feature branches based on `main`.

## Security Baseline

- **Auth method**: Not yet selected.
- **CSRF**: Define if cookie-based authenticated APIs are introduced.
- **XSS**: Rely on Angular sanitization and avoid bypass APIs without explicit review.
- **Secrets**: Never store secrets in source control; use environment-specific secret management.
- **Dependencies**: Keep Angular and its toolchain on supported versions and review dependency alerts.

## Code Quality

- **Linter**: ESLint 10.10.0 with angular-eslint 22.1.0 flat configuration.
- **Formatter**: Prettier 3.9.7.
- **Testing**: Vitest 4.1.11 through `@angular/build:unit-test`; CI uses `ng test --watch=false`.
- **Type checking**: Keep TypeScript `strict` and Angular `strictTemplates` enabled; avoid unsafe casts.

## Copilot / Skills Generator

- **Status**: Skills Generator not configured. Run `ef:skills generate` when ready.
- **Generated instructions**: `.github/copilot-instructions.md` is managed manually.
- **Generated skills**: No generated skill files are present.

---

*Updated via `ef:standards update <section>`. All changes require human confirmation.*
