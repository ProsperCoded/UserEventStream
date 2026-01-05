# Notification Service

User-facing **Notification System**.

## Responsibilities

- Consumes `user.events` from Kafka.
- Applies rules to trigger notifications.
- Logs notifications to file (simulating email/SMS).

## Tech Stack

- **Framework**: NestJS
- **Messaging**: Kafka (Consumer)

## Notification Rules

1. **Welcome**: on `user.created`.
2. **Security Alert**: on `user.password_changed` or `user.ip_changed`.
3. **Threshold Warning**: on 3+ `user.login_failed` events.

## Scaling

- Configured for **3 replicas**.
- Demonstrates partition rebalancing in Kafka.

## Output

- Logs written to `notifications.log` in the container/root.
