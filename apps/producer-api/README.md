# Producer API Service

**Ingress service** for the User Event Stream Platform.

## Responsibilities

- Accepts user actions via HTTP REST API.
- Stores user state in **PostgreSQL** (Source of Truth).
- Emits events to **Kafka** (`user.events` topic).

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Messaging**: Kafka (Producer)

## Database Schema (Drizzle)

- `users`: Stores user credentials and status.

## Key Endpoints

- `POST /users`: Create new user.
- `POST /users/login`: Login user.
- `POST /users/:id/logout`: Logout user.
