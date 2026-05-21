# Test Toolkit Pro

A secure online quiz / examination platform built with TanStack Start, React 19, Tailwind CSS v4, and Lovable Cloud (Supabase).

Students authenticate with a registration number + personal PIN, take timed quizzes, and admins manage students, questions, results, and evidence PDFs from a dedicated dashboard.

## Features

- **Student auth with PIN** – registration number lookup, first-time PIN creation, SHA-256 hashed PINs stored in the database.
- **Quiz engine** – timed quizzes, auto-submission, per-student answer tracking.
- **Results & evidence PDFs** – per-student PDF generation via `jsPDF`, with an admin-controlled toggle for student self-download.
- **Admin dashboard** – manage quizzes, questions, students; download single or combined evidence PDFs for all students.
- **Lovable Cloud backend** – Postgres + Auth + RLS policies; server logic via TanStack `createServerFn`.

## Tech Stack

- **Framework**: TanStack Start v1 (React 19, SSR)
- **Build**: Vite 7
- **Styling**: Tailwind CSS v4 (semantic tokens in `src/styles.css`)
- **UI**: shadcn/ui + Radix
- **Backend**: Lovable Cloud (Supabase – Postgres, Auth, RLS)
- **PDF**: jsPDF
- **Runtime**: Bun (dev), Node 22 (CI)

## Getting Started

```bash
bun install
bun run dev
```

The dev server runs at `http://localhost:3000`.

### Environment Variables

Auto-provisioned by Lovable Cloud in `.env` (do not edit manually):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start Vite dev server |
| `bun run build` | Production build |
| `bun run preview` | Preview the production build |
| `bun run lint` | Run ESLint |
| `bun run format` | Format with Prettier |

## Project Structure

```
src/
  routes/                 # File-based routes (TanStack Router)
    index.tsx             # Student login (reg # + PIN) + quiz list
    exam.tsx              # Quiz taking interface
    result.tsx            # Student result page
    admin.*.tsx           # Admin dashboard, quizzes, questions, students
  integrations/supabase/  # Auto-generated Supabase clients (do not edit)
  components/ui/          # shadcn components
  lib/                    # exam logic + PDF helpers
  styles.css              # Tailwind v4 + semantic design tokens
supabase/migrations/      # Database migrations
.github/workflows/        # CI/CD pipelines
```

## CI/CD

Two GitHub Actions workflows:

### 1. `ci.yml` – Pull Request checks

Runs on every push and PR to `main` / `master`:

- Install dependencies (Bun)
- Lint (`bun run lint`)
- Type-check & build (`bun run build`)

### 2. `aws.yml` – Deploy to AWS EC2

Runs on push to `main` / `master`:

1. Checkout + setup Node 22 + Bun
2. Install dependencies and build the project with production env vars
3. SSH into the EC2 instance
4. Pull latest code, rebuild, and restart the `quiz-app` PM2 process

#### Required GitHub Secrets

| Secret | Purpose |
| --- | --- |
| `EC2_SSH_KEY` | Private SSH key for the EC2 user |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ref |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |

Configure under **GitHub repo → Settings → Secrets and variables → Actions**.

#### EC2 prerequisites

The target instance must have: `git`, `bun`, `node 22+`, `pm2`, and the repo cloned at `/home/ec2-user/test-toolkit-pro`.

## Security Notes

- Student PINs are hashed with SHA-256 before being stored.
- All database access is gated by Row-Level Security (RLS) policies.
- Service-role keys are never exposed to the client; only the publishable key is bundled.
- Admin-only operations (e.g. bulk evidence export) live behind authenticated routes.

## License

Proprietary – all rights reserved.