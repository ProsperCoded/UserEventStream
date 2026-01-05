# User Event Stream Platform

## Running the Project

This project is a NestJS Monorepo using Docker Compose to orchestrate Kafka, databases, and microservices.

### Prerequisites

- Docker Desktop installed and running.

### Start the Platform

Run the following command in the root directory:

```bash
docker-compose up --build
```

This will:

1. Start **Kafka** (KRaft mode).
2. Start **PostgreSQL** and **MongoDB**.
3. Start **Kafka UI** for observability.
4. Build and start the 4 microservices using the shared root `Dockerfile`.

### Services

| Service                  | Replicas | Port (Host) | Description                                        |
| ------------------------ | -------- | ----------- | -------------------------------------------------- |
| **Producer API**         | 1        | 3000        | Ingress API for user actions                       |
| **Notification Service** | 3        | -           | Consumes events (3 instances for rebalancing demo) |
| **Analytics Service**    | 1        | -           | Consumes events for metrics (MongoDB)              |
| **Fraud Detection**      | 1        | -           | Detects suspicious patterns (MongoDB)              |
| **Kafka**                | 1        | 9092        | Event broker                                       |
| **Kafka UI**             | 1        | 8080        | Observability Dashboard                            |

### Observability With Kafka UI

**Provectus Kafka UI** is running at [http://localhost:8080](http://localhost:8080).

Use it to:

- **Inspect Topics**: Verify `user.events` exists and check partition distribution.
- **View Messages**: See real-time events, headers, and payloads.
- **Monitor Consumer Groups**: Check lag for `analytics-consumer-group`, `notification-consumer-group`, etc.
- **Observe Rebalancing**: Scale the Notification Service and watch partition reassignment in real-time.

### Project Structure

- **apps/**: Individual microservices.
- **libs/shared**: Shared code (Event types, Kafka config) used by all apps.
- **Dockerfile**: Universal build file for all apps.
