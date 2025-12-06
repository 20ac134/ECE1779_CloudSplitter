# DigitalOcean notes

1. Create a Droplet (Ubuntu 24.04), install Docker and initialize Swarm.
   ```sh
   curl -fsSL https://get.docker.com | sh
   sudo docker swarm init
   ```
2. Create a `.env` on the manager with DB and JWT settings.
3. `docker stack deploy -c docker-stack.yml cloudsplitter`.
4. Point a domain to the droplet and add a reverse proxy (Caddy or Traefik with automatic TLS) if you want HTTPS.
