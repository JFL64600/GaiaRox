# Project: GaiaRox

> An Angular application for collecting timing results from chronometers.

## What This Is

GaiaRox is a planned Angular application that records times produced by chronometers. It is intended for people running timed activities or competitions who need a central interface for collecting results.

The repository is currently at its initial stage. Chronometer integration details, user roles, persistence, and reporting requirements remain to be specified before implementation planning.

## Core Value

Collect chronometer times accurately in one usable application.

## Requirements

### Validated (confirmed by stakeholders)
- Build the application with Angular.
- Collect timing values from chronometers.

### Active (in current scope)
- Define how chronometers provide timing data.
- Define the timing workflow, storage, and user experience.

### Out of Scope
- Features not directly related to collecting and managing timing results.
- Specific integrations or deployment targets until they are confirmed.

## Context

### Tech Stack
| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Frontend | Angular | 22.1.7 | Stakeholder requirement; pinned supported baseline |
| CLI / Build | Angular CLI / `@angular/build` | 22.1.8 | Reproducible workspace tooling |
| Language | TypeScript | 6.0.3 | Strict Angular-compatible compilation |
| Unit tests | Angular unit-test builder + Vitest | Vitest 4.1.11 | Supported one-shot Node.js/jsdom tests |
| Linting | angular-eslint / ESLint | 22.1.0 / 10.10.0 | Angular template and TypeScript linting |

### Architecture
The application uses an Angular standalone root component bootstrapped from `src/main.ts`, with routing configured through application providers.

### Existing Patterns
- Standalone Angular components and application configuration.
- Strict TypeScript compilation and strict Angular template checking.
- Vitest tests run through the Angular `@angular/build:unit-test` builder.

### External Dependencies
- Chronometer hardware or timing data source (protocol to be determined).

## Constraints

### Technical
- Preserve type safety and follow the conventions of the selected Angular version.
- Timing ingestion must avoid silently losing or duplicating results.

### Business
- Timing workflows and expected users must be confirmed before feature implementation.

### Timeline
- No delivery deadline has been specified.

## Key Decisions

| # | Decision | Rationale | Date | Alternatives Rejected |
|---|----------|-----------|------|----------------------|
| 1 | Use Angular for the application | Stakeholder requirement | 2026-09-17 | Not evaluated |
| 2 | Pin Angular 22.1.7 with CLI/build tooling 22.1.8 | Current stable CLI resolved from npm and compatible with Node 24.21.0 | 2026-09-17 | Floating toolchain versions |
| 3 | Use the generated Vitest runner through Angular's unit-test builder | Current Angular scaffold default; runs without a browser dependency | 2026-09-17 | Obsolete or browser-required test tooling |

---

*This file is the project constitution. It changes only for fundamental shifts, not for daily progress. Updated via `ef:adjust` when scope fundamentally changes.*
