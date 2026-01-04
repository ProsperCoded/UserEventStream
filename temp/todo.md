I want you to modify the existing docker Compose setup for the services that we didn't support before.

1. **Services:**
   - **Producer API** (NestJS app) – emits user events to Kafka
   - **Notification Service** (NestJS app) – 3 replicas, same consumer group
   - **Analytics Service** (NestJS app)
   - **Fraud Detection Service** (NestJS app)
   - **PostgreSQL** – user source-of-truth
   - **MongoDB** – analytics and fraud reports
   - **Kafka** and **Zookeeper**

2. **Networking:**
   - All services should be on the same Docker network
   - NestJS apps should connect to Kafka and databases via container hostnames

3. **Kafka setup:**
   - Single topic: `user.events`
   - Expose Kafka port for local testing
   - Zookeeper included

4. **NestJS services:**
   - Each app should build from its own folder
   - Notification service should have 3 replicas
   - Use environment variables for Kafka brokers, group IDs, DB connections

5. **Command:**
   - `docker-compose up --build` should start the entire stack
   - Each service should log to console so I can see consumer group assignment and partition distribution
