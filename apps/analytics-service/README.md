# Analytics Service

**Analytics Consumer** for deriving metrics from the event stream.

## Responsibilities

- Consumes `user.events` from Kafka.
- Reconstructs state for analytics.
- Stores aggregates in **MongoDB**.

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB (Mongoose)
- **Messaging**: Kafka (Consumer)

## Metrics Tracked

- **DAU (Daily Active Users)**: Unique users per day (stored in `dailyactivity` collection).
- **MAU (Monthly Active Users)**: Unique users per month (stored in `monthlyactivity` collection).
- **Sessions**: Session duration and event counts (stored in `sessions` collection).

## Consumer Group

- ID: `analytics-consumer-group`
- Strategy: Replays from beginning on start to rebuild state.
