# Spidex Core

A robust backend API service built with NestJS, providing a scalable and maintainable foundation for web applications.

## Table of Contents

- [Project Description](#project-description)
- [Technologies Used](#technologies-used)
- [Requirements](#requirements)
- [Installation Instructions](#installation-instructions)
- [Usage Instructions](#usage-instructions)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Support Information](#support-information)
- [Project Roadmap](#project-roadmap)
- [Project Status](#project-status)
- [Contribution Guidelines](#contribution-guidelines)
- [Acknowledgments](#acknowledgments)
- [License Information](#license-information)

## Project Description

Spidex Core is a powerful backend API service built with NestJS, providing a foundation for web applications. It includes authentication, database integration, caching, scheduled tasks, and other essential features for modern web applications.

## Technologies Used

- **NestJS**: Progressive Node.js framework for building server-side applications
- **TypeScript**: Type-safe JavaScript superset
- **TypeORM**: ORM for database interactions
- **PostgreSQL**: Primary database
- **Redis**: Caching and messaging
- **Swagger**: API documentation
- **Docker**: Containerization
- **Bull**: Queue management
- **WebSockets**: Real-time communication
- **Passport**: Authentication
- **JWT**: Token-based authentication

## Requirements

- Node.js 20.x or higher
- PostgreSQL
- Redis
- Docker and Docker Compose (for containerized deployment)

## Installation Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd spidex-core
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your configuration.

4. Setup the database:
   ```bash
   yarn db:migration:run
   ```

## Usage Instructions

### Development

Run the application in development mode:
```bash
yarn dev
```

### Production

Build and run for production:
```bash
yarn build
yarn start:prod
```

### Using Docker

Build and run using Docker Compose:
```bash
docker-compose up -d
```

For infrastructure services only:
```bash
docker-compose -f docker-compose.infra.yml up -d
```

### Database Commands

- Generate migration: `yarn db:migration:generate`
- Create migration: `yarn db:migration:create`
- Run migrations: `yarn db:migration:run`
- Show migrations: `yarn db:migration:show`
- Revert migration: `yarn db:migration:revert`
- Synchronize schema: `yarn db:sync`
- Drop schema: `yarn db:drop`
- Seed database: `yarn db:seed`

### Testing

- Run tests: `yarn test`
- Run tests with watch mode: `yarn test:watch`
- Run tests with coverage: `yarn test:cov`
- Run end-to-end tests: `yarn test:e2e`

## Documentation

API documentation is automatically generated using Swagger and can be accessed at:
```
http://localhost:8000/swagger
```
(Replace with your actual Swagger path from configuration)

## Project Structure

```
├── src/
│   ├── adapters/          # Adapters for external services
│   ├── config/            # Configuration files
│   ├── constants/         # Application constants
│   ├── database/          # Database migrations and seeders
│   ├── modules/           # Feature modules
│   ├── public/            # Public assets
│   ├── shared/            # Shared modules and utilities
│   ├── app.controller.ts  # Main application controller
│   ├── app.module.ts      # Main application module
│   ├── app.service.ts     # Main application service
│   ├── main.ts            # Application entry point
│   ├── core-consumer.ts   # Kafka consumer
│   └── ormconfig.ts       # TypeORM configuration
├── test/                  # Test files
├── docker-compose.yml     # Docker Compose configuration
└── Dockerfile             # Docker configuration
```

## Support Information

For support, please reach out to the development team or create an issue in the project repository.

## Project Roadmap

- Feature enhancements
- Performance optimizations
- Additional integrations
- Expanded test coverage

## Project Status

This project is actively maintained and under continuous development.

## Contribution Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## Acknowledgments

- NestJS team for the excellent framework
- All contributors who have helped with the development

## License Information

This project is proprietary and confidential. Unauthorized copying, transfer, or reproduction of the contents of this project is prohibited.
