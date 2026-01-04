# User Event Stream Platform

## Running the Project

This project is a NestJS Monorepo using Docker Compose to orchestrate Kafka, Zookeeper, databases, and microservices.

### Prerequisites

- Docker Desktop installed and running.

### Start the Platform

Run the following command in the root directory:

```bash
docker-compose up --build
```

This will:

1. Start **Zookeeper** and **Kafka**.
2. Start **PostgreSQL** and **MongoDB**.
3. Build and start the 4 microservices using the shared root `Dockerfile`.

### Services

| Service                  | Replicas | Port (Host) | Description                                        |
| ------------------------ | -------- | ----------- | -------------------------------------------------- |
| **Producer API**         | 1        | 3000        | Ingress API for user actions                       |
| **Notification Service** | 3        | -           | Consumes events (3 instances for rebalancing demo) |
| **Analytics Service**    | 1        | -           | Consumes events for metrics (MongoDB)              |
| **Fraud Detection**      | 1        | -           | Detects suspicious patterns (MongoDB)              |
| **Kafka**                | 1        | 9092        | Event broker                                       |

### Project Structure

- **apps/**: Individual microservices.
- **libs/shared**: Shared code (Event types, Kafka config) used by all apps.
- **Dockerfile**: Universal build file for all apps.
