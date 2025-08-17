# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `yarn dev` - Start development server with hot reload
- `yarn build` - Build the application for production
- `yarn start:prod` - Run production build
- `yarn lint` - Run ESLint with auto-fix
- `yarn test` - Run Jest unit tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:cov` - Run tests with coverage report
- `yarn test:e2e` - Run end-to-end tests

### Database Commands
- `yarn db:migration:generate` - Generate new migration based on entity changes
- `yarn db:migration:create` - Create empty migration file
- `yarn db:migration:run` - Apply pending migrations
- `yarn db:migration:revert` - Revert last migration
- `yarn db:migration:show` - Show migration status
- `yarn db:seed` - Run database seeders

### Background Services
- `yarn core:consumer` - Start Kafka consumer for background processing
- `yarn console:dev` - Run console commands in development
- `yarn local` - Run local development script

## Architecture Overview

### Core Architecture Pattern
This is a **NestJS-based microservice** with event-driven architecture using RabbitMQ and Kafka for async processing. The system follows a modular monolith pattern with clear separation between business domains.

### Key Architectural Components

**Module Structure**: Each business domain is encapsulated in its own module with controllers, services, DTOs, and repositories. Core modules are defined in `src/modules/index.ts`.

**Database Layer**: Uses TypeORM with PostgreSQL. Entity definitions in `database/entities/`, repositories in `database/repositories/`, migrations in `database/migrations/`.

**Event-Driven Processing**: 
- RabbitMQ for inter-service communication (quest completion, point calculations)
- Kafka for external event processing (trading events, social verification)
- Background consumers in `src/modules/consumer/core/`

**External Integrations**: Organized in `src/external/` with dedicated modules for each service (Blockfrost for Cardano, Minswap for DEX, Discord/Telegram for social verification).

### Critical Business Logic

**Quest System**: Three quest categories with different completion rules:
- `ONE_TIME`: Can only be completed once per user
- `DAILY`: Can be completed once per day
- `MULTI_TIME`: Can be completed multiple times up to a limit

**Point System**: Users earn points from quest completion, with automatic referral bonuses. Points are tracked in `user-point.entity.ts` with detailed logs in `user-point-log.entity.ts`.

**Trading Integration**: Monitors Cardano blockchain transactions via Blockfrost, integrates with Minswap DEX for swap tracking, automatically triggers trade-related quests.

### Configuration & Environment

**Environment Setup**: Copy `.env.example` to `.env` and configure all required services (PostgreSQL, Redis, external APIs).

**Database Configuration**: `src/ormconfig.ts` handles TypeORM setup with environment-based configuration.

**Module Registration**: All modules are centrally registered in `src/modules/index.ts` and imported into `app.module.ts`.

### Testing Strategy

**Unit Tests**: Located alongside source files with `.spec.ts` suffix
**E2E Tests**: In `/test` directory for full integration testing
**Database Tests**: Use separate test database configuration

### Key Dependencies to Understand

- **TypeORM**: ORM with custom repositories and transactional decorators
- **BullMQ**: Job queue for background processing
- **RabbitMQ**: Message broker for event-driven architecture
- **Blockfrost**: Cardano blockchain API integration
- **Firebase Admin**: Authentication and user management
- **Sharp**: Image processing for media uploads

### Common Patterns

**Repository Pattern**: Custom repositories extend base repository with domain-specific queries
**Event Emitters**: Services emit events via RabbitMQ for async processing
**Transactional Operations**: Use `@Transactional()` decorator for database consistency
**Validation**: DTOs use class-validator decorators for request validation
**Error Handling**: Centralized error constants in `constants/error.constant.ts`

### Development Flow

1. Database changes require migrations: `yarn db:migration:generate`
2. New modules follow existing structure with controller/service/dto/repository
3. Event-driven features require both emitter and consumer implementation
4. External API integrations go in `src/external/` with dedicated modules
5. All business logic should be testable and include proper error handling

### File Structure Conventions

- `@constants/` - Application-wide constants and enums
- `@shared/` - Shared utilities, decorators, and modules  
- `@modules/` - Feature modules with business logic
- `@database/` - Database entities, repositories, migrations
- `external/` - Third-party service integrations