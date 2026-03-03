# Faultline

A cyberpunk hacker RPG built with Rust. Hack systems, form syndicates, control territory, and climb the ranks across interconnected networks.

Built on [Loco](https://loco.rs) and [fracture-core](https://github.com/Sp0Q1/fracture-cms).

## Tech Stack

- **Backend**: Rust, Loco framework, Axum, SeaORM
- **Database**: SQLite
- **Auth**: OIDC via Zitadel (dev) or any OIDC provider
- **Frontend**: Tera templates, vanilla JS, OAT component library, Cybercore CSS
- **Game state**: localStorage (no backend game logic)
- **Containers**: Podman

## Game Features

- **Hacking Ops** — 6 hack types with nerve/CPU costs, cooldowns, and stat-based success rates
- **Leveling & XP** — Level 1-100 progression with exploit points
- **Player Stats** — Cracking, Stealth, Firewall, Bandwidth with trainable stats
- **Syndicate Wars** — Form syndicates, raid rivals, defend territory
- **Black Market** — Buy/sell upgrades, tools, and consumables
- **Network Travel** — 7 networks (Clearnet to DeepWeb) with level/rep gates
- **Missions** — 3 fixers offering procedural contracts
- **Merit Tree** — 6 branches with 30 unlockable perks
- **Network Map** — SVG territory visualization with node capture

## Prerequisites

- [Podman](https://podman.io/) and podman-compose
- [curl](https://curl.se/) and [jq](https://jqlang.github.io/jq/) (for dev setup)

## Quick Start

```bash
# 1. Start identity provider and email (first time only)
bash dev/setup.sh

# 2. Start remaining services
podman compose up -d

# 3. Open the app
open http://localhost:5150
```

Test credentials: `testuser` / `TestPassword1!`

## Services

| Service     | URL                       | Purpose              |
|-------------|---------------------------|----------------------|
| App         | http://localhost:5150      | Faultline web app    |
| Zitadel     | http://localhost:8080      | OIDC identity provider |
| MailCrab    | http://localhost:1080      | Email testing UI     |

## Development

Asset files (CSS, JS, HTML templates) are volume-mounted into the container. After editing assets:

```bash
podman compose restart app
```

Rust code changes require a rebuild:

```bash
podman compose down && podman compose build app && podman compose up -d
```

## CI

Run all checks locally:

```bash
bash dev/ci.sh
```

This runs (in a container):
1. **rustfmt** — formatting check
2. **clippy** — lints (pedantic + nursery + rust-2018-idioms, deny warnings)
3. **semgrep** — security scanning
4. **cargo test** — test suite

## Project Structure

```
assets/
  i18n/           # Fluent translations
  static/         # CSS, JS, static HTML
  views/          # Tera templates
config/           # Loco config (development, production, test)
dev/              # Dev scripts, Dockerfiles, CI
migration/src/    # SeaORM migrations (chains fracture-core)
src/
  bin/            # CLI entrypoint
  controllers/    # Route handlers
  initializers/   # Startup hooks (template engine, OIDC, CSP)
  mailers/        # Email templates
  models/         # SeaORM entities
  views/          # Template rendering logic
```

## Configuration

Copy `.env.example` to `.env` and fill in the values, or use `dev/setup.sh` which generates them automatically.

| Variable            | Purpose                    |
|---------------------|----------------------------|
| `JWT_SECRET`        | Session signing key        |
| `OIDC_PROJECT_ID`   | Zitadel project ID         |
| `OIDC_CLIENT_ID`    | OIDC client ID             |
| `OIDC_CLIENT_SECRET`| OIDC client secret         |

## License

Private — not licensed for redistribution.
