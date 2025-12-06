# Cloud Splitter

A cloud-native expense sharing app. Run with Docker locally; Swarm file included for DigitalOcean.

## Quick start

1. Copy `.env.example` to `.env` and adjust values.
2. `docker compose up --build`.
3. Open web: http://localhost:5173, API: http://localhost:8080, MailHog: http://localhost:8025.

Default seed users:
- alice@example.com / password
- bob@example.com / password

## Swarm (DigitalOcean)
- `docker swarm init` (or join existing swarm)
- `docker stack deploy -c docker-stack.yml cloudsplitter`

## Tests
- Backend has lightweight route tests via `npm test` (inside container or locally).
