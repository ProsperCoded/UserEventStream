# Fraud Detection Service

Real-time **Fraud Detection Engine**.

## Responsibilities

- Consumes `user.events`.
- Detects suspicious behavioral patterns using a **sliding time window**.
- Emits action events (`user.flagged`, `user.suspended`) back to Kafka.
- Stores fraud reports in **MongoDB**.

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB (Mongoose)
- **Messaging**: Kafka (Consumer & Producer)

## Fraud Rules

1. **Compromised Account Pattern**: Password Change -> IP Change -> Login (within 5 mins).
2. **Brute Force**: >= 5 Login Failures within 2 mins.
3. **IP Hopping**: >= 3 distinct IPs within 10 mins.

## Risk Scoring

- **>= 30 detection**: Flag user.
- **>= 70 detection**: Suspend user.
