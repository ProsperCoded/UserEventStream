# User Event Stream Platform (Kafka + NestJS)

## Project Requirements Document (PRD)

---

## 1. Overview

The **User Event Stream Platform** is an event-driven system designed to demonstrate **real-world Kafka usage** for post-processing, fan-out distribution, and independent consumption of immutable events.

Kafka acts as the **central source of truth** for user activity events. Multiple downstream services consume the same event stream for **analytics**, **notifications**, and **fraud detection**, each operating independently at different speeds and with different state models.

This project intentionally avoids using Kafka as an RPC mechanism and instead models Kafka as a **distributed commit log**.

---

## 2. Core Objectives

- Demonstrate correct, production-aligned Kafka usage
- Implement event fan-out with multiple consumer groups
- Support replayability and post-processing of historical events
- Show consumer group scaling and partition rebalancing
- Separate source-of-truth data from derived state
- Provide end-to-end testability using Docker Compose

---

## 3. High-Level Architecture

### Components

- **Producer API (Ingress Service)**
  - Accepts user-related actions
  - Emits immutable events to Kafka

- **Kafka Cluster**
  - Central event log
  - Single primary topic: `user.events`

- **Consumers (Independent NestJS Apps)**
  - Analytics Service
  - Notification Service (3 instances)
  - Fraud Detection Service

- **Datastores**
  - PostgreSQL: User source-of-truth
  - MongoDB: Analytics & fraud-derived data

- **Orchestration**
  - Docker Compose manages all services

---

## 4. Event Design

### 4.1 Canonical Event Envelope

All events emitted to Kafka must conform to the following structure:

```ts
{
  eventId: string;            // UUID
  eventType: string;          // e.g. user.created
  aggregateId: string;        // userId
  occurredAt: string;         // business timestamp (can be in the past)
  receivedAt: string;         // ingestion timestamp
  payload: {
    email?: string;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  };
}
```

### 4.2 Event Types

- `user.created`
- `user.logged_in`
- `user.logged_out`
- `user.login_failed`
- `user.password_changed`
- `user.ip_changed`
- `user.suspended`
- `user.flagged`

### 4.3 Partition Strategy

- Kafka topic is partitioned by `aggregateId` (`userId`)
- Ensures per-user ordering across all consumers

---

## 5. Kafka Topics

| Topic | Purpose |
|------|--------|
| `user.events` | Central immutable event log |
| `notifications.dlq` | Failed notification events |

---

## 6. Services Specification

---

## 6.1 Producer API (Ingress Service)

### Responsibilities

- Accept user actions via HTTP
- Validate requests minimally
- Emit corresponding Kafka events
- Store user source-of-truth in PostgreSQL

### Key Characteristics

- Does NOT query consumer services
- Does NOT wait for Kafka consumers
- Emits events asynchronously

### PostgreSQL Usage

- Users table
- Authentication state
- Account status (active / suspended)

---

## 6.2 Notification Service

### Purpose

Handles user-facing notifications derived from events.

### Consumer Group

- **Group ID:** `notification-consumer-group`
- **Instances:** 3 (to demonstrate partition rebalancing)

### Triggering Events

| Event Type | Notification |
|----------|-------------|
| `user.created` | Welcome message |
| `user.password_changed` | Security alert |
| `user.ip_changed` | Security alert |
| `user.login_failed` (threshold-based) | Warning |

### Processing Flow

1. Consume event
2. Apply notification rules
3. Generate notification content
4. Log notification to file (email + timestamp)

### Non-Functional Requirements

- Stateless
- Idempotent processing (eventId-based deduplication)
- Retry on failure
- Dead-letter failed messages

---

## 6.3 Analytics Service

### Purpose

Derives usage metrics from the event stream.

Kafka is the **only source of truth** for analytics data.

### Consumer Group

- **Group ID:** `analytics-consumer-group`

### Metrics Tracked

#### Daily Active Users (DAU)

- A user is active if they generate at least one session-related event on a given day
- Bucketed by `occurredAt`

#### Monthly Active Users (MAU)

- Same logic as DAU
- Bucketed monthly

#### Session Counts

- Session starts at `user.logged_in`
- Session ends at `user.logged_out` or timeout

### MongoDB Storage

- Daily activity aggregates
- Monthly activity aggregates
- Session documents

### Key Characteristics

- Replayable
- Offset-driven state
- No dependency on Producer DB

---

## 6.4 Fraud Detection Service

### Purpose

Detects suspicious behavior using **temporal event patterns**.

### Consumer Group

- **Group ID:** `fraud-detection-group`

### Maintained State (Per User)

- Recent event window
- Risk score

### Fraud Rules

1. Password change → IP change → login (within 5 minutes)
2. ≥5 login failures within 2 minutes
3. Multiple IP changes within short duration

### Risk Thresholds

| Score | Action |
|------|--------|
| ≥30 | Flag user |
| ≥50 | Force password reset |
| ≥70 | Suspend user |

### Output Events

- `user.flagged`
- `user.suspended`

### MongoDB Storage

- Fraud reports
- Risk evaluations
- Event traces

---

## 7. Data Storage Strategy

### PostgreSQL

- User entities
- Authentication state
- Strong consistency required

### MongoDB

- Analytics aggregates
- Fraud reports
- Append-heavy, schema-flexible data

This split reflects **real-world event-driven architectures** where Kafka feeds derived data stores.

---

## 8. Docker Compose Orchestration

Docker Compose will orchestrate:

- Kafka
- Zookeeper (if required)
- Producer API
- Analytics Service
- Notification Service (3 replicas)
- Fraud Detection Service
- PostgreSQL
- MongoDB

### Goals

- Single-command startup
- Deterministic local environment
- E2E test compatibility

---

## 9. Testing Strategy

### End-to-End Testing

1. Start Docker Compose stack
2. Boot producer and consumers
3. Produce events via API
4. Assert:
   - Analytics data stored correctly
   - Notifications logged
   - Fraud actions triggered

### Testing Considerations

- Unique consumer group IDs per test run
- Offset isolation
- Deterministic timestamps

---

## 10. Non-Goals

- Real SMS / email provider integration
- UI dashboards
- Exactly-once semantics enforcement
- Kafka Streams usage

---

## 11. Success Criteria

- Kafka clearly functions as a central event log
- Consumers operate independently
- Consumer group rebalancing observable
- Replay of historical events produces correct state
- System behavior aligns with real-world Kafka usage

---

## 12. Future Extensions (Optional)

- Event versioning
- Schema registry integration
- Stream enrichment pipelines
- Kafka Streams / ksqlDB
- Alerting dashboards

---

**This project prioritizes correctness of mental models over feature count.**

