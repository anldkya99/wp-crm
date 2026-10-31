# Operation Pact Constitution

This document records permanent architecture rules for the Operation Pact development lifecycle.

## Development Rule - Mandatory Constitution Compliance

Before making any architectural or implementation changes, every contributor, human or AI, must read, understand, and follow the Operation Pact Constitution.

If any requested implementation conflicts with the Constitution:

- Stop.
- Do not make assumptions.
- Report the conflict before continuing.

Compliance with the Operation Pact Constitution is mandatory for all future development.

## Constitution Rule #6 - Mandatory Architecture Review

Every completed sprint must pass an Architecture Review before the next sprint begins.

A sprint is not considered complete until all of the following have been reviewed:

- Constitution compliance is verified.
- Layer architecture violations are reviewed.
- Technical debt is classified.
- Future scalability is evaluated.
- A formal architecture recommendation is issued.

Architecture Review is a mandatory phase of the Operation Pact development lifecycle.

Development lifecycle:

```text
Planning
↓
Sprint Specification
↓
Implementation
↓
Architecture Review
↓
Approval
↓
Next Sprint
```

This rule applies to all future sprints.

## Constitution Rule #8 - Module Boundary Isolation

Platform modules must not directly access another module's persistence data, Prisma model, repository, or private storage adapter.

Cross-module interaction must use official platform contracts such as the Service Framework, Event Framework, declared extension points, or other approved runtime interfaces.

Module core definitions, module option types, and company/runtime business data remain separate layers.

## Constitution Rule #7 - Platform-Wide Localization Standard

Operation Pact permanently separates programming language, development interface language, and user interface language.

- Programming language, technical identifiers, source code symbols, APIs, database schemas, routes, permissions, roles, service names, event names, workflow identifiers, and internal architecture remain English.
- The development administration interface defaults to Turkish.
- User-facing language is selectable through the centralized localization architecture.
- All future user-visible text must use translation resources instead of hardcoded strings.
- English remains the fallback language when a translation key is missing.

## Constitution Rule #9 - Database Promotion Policy

No migration may be tried for the first time directly against a production database.

All migrations must first be applied successfully and verified against the OP Test Server database:

```text
operation_pact_test
```

A migration that has not been verified in the test environment may not be promoted to production.
