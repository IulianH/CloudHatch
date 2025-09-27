# CloudHatch Frontend

This is a [Next.js](https://nextjs.org) project for the CloudHatch cloud management platform, bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Local Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Docker Development

#### Prerequisites
- Docker and Docker Compose installed on your system
- At least 4GB of available RAM for Docker

#### Quick Start

**For Development (Recommended - equivalent to `npm run dev`):**
```bash
# Start development container with hot reload
docker-compose --profile dev up --build frontend-dev

# Access the app at: http://localhost:3001
```

**For Production Testing:**
```bash
# Start production container
docker-compose up --build

# Access the app at: http://localhost:3000
```

#### Docker Modes Comparison

| Mode | Port | Hot Reload | Build Time | Use Case | Equivalent Command |
|------|------|------------|------------|----------|-------------------|
| **Development** | 3001 | ✅ Yes | Fast | Active development | `npm run dev` |
| **Production** | 3000 | ❌ No | Optimized | Production testing | `npm run build && npm start` |

#### Development Workflow (Docker equivalent to `npm run dev`)

The development container provides the same experience as `npm run dev`:

1. **Start development:**
   ```bash
   docker-compose --profile dev up --build frontend-dev
   ```

2. **Open browser:** Navigate to `http://localhost:3001`

3. **Start coding:** Edit any file in `src/` directory - changes auto-reload in browser

4. **Stop development:**
   ```bash
   docker-compose down
   ```

#### Complete Docker Commands

**Container Management:**
```bash
# Start production container
docker-compose up --build

# Start development container (hot reload)
docker-compose --profile dev up --build frontend-dev

# Start in background (detached mode)
docker-compose up --build -d
docker-compose --profile dev up --build -d frontend-dev

# Stop all containers
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

**Viewing Logs:**
```bash
# View production logs
docker-compose logs frontend

# View development logs
docker-compose logs frontend-dev

# Follow logs in real-time
docker-compose logs -f frontend-dev

# View last 50 lines
docker-compose logs --tail=50 frontend-dev
```

**Rebuilding:**
```bash
# Rebuild without cache (if package.json changed)
docker-compose --profile dev build --no-cache frontend-dev
docker-compose --profile dev up frontend-dev

# Rebuild production
docker-compose build --no-cache frontend
docker-compose up frontend
```

**Individual Docker Commands:**
```bash
# Build production image only
docker build -t cloudhatch-frontend .

# Build development image only
docker build -f Dockerfile.dev -t cloudhatch-frontend-dev .

# Run production image
docker run -p 3000:3000 cloudhatch-frontend

# Run development image with volume mounting
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules cloudhatch-frontend-dev
```

#### Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Update values in `.env.local`** as needed for your environment

3. **Environment variables are automatically loaded** by Docker Compose

#### Common Development Scenarios

**Scenario 1: First time setup**
```bash
# 1. Clone and navigate to project
cd frontend

# 2. Copy environment file
cp env.example .env.local

# 3. Start development
docker-compose --profile dev up --build frontend-dev

# 4. Open http://localhost:3001
```

**Scenario 2: After pulling new changes**
```bash
# 1. Pull latest changes
git pull

# 2. Rebuild containers
docker-compose --profile dev up --build frontend-dev
```

**Scenario 3: Testing production build locally**
```bash
# 1. Build and run production
docker-compose up --build

# 2. Test at http://localhost:3000

# 3. Stop when done
docker-compose down
```

**Scenario 4: Dependency changes**
```bash
# 1. After modifying package.json
docker-compose --profile dev build --no-cache frontend-dev

# 2. Start with new dependencies
docker-compose --profile dev up frontend-dev
```

#### Troubleshooting

**Port already in use:**
```bash
# Check what's using the port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in docker-compose.yml
```

**Container won't start:**
```bash
# Check logs for errors
docker-compose logs frontend-dev

# Rebuild without cache
docker-compose --profile dev build --no-cache frontend-dev
```

**Hot reload not working:**
```bash
# Ensure you're using the development profile
docker-compose --profile dev up frontend-dev

# Check if volumes are mounted correctly
docker-compose exec frontend-dev ls -la /app
```

**"Unknown or unexpected option: --turbopack" error:**
```bash
# This is fixed in the Dockerfiles by using npx next dev/build instead of npm scripts
# If you still see this error, rebuild without cache:
docker-compose --profile dev build --no-cache frontend-dev

# Or manually run without turbopack:
docker-compose exec frontend-dev npx next dev
```

**"Configuring Next.js via 'next.config.ts' is not supported" error:**
```bash
# This is fixed - the config file has been renamed to next.config.js
# If you still see this error, rebuild without cache:
docker-compose --profile dev build --no-cache frontend-dev
```

**"Unknown font `Geist`" error:**
```bash
# This is fixed - fonts have been changed to Inter and JetBrains Mono
# If you still see this error, rebuild without cache:
docker-compose --profile dev build --no-cache frontend-dev
```

**"Module not found: Can't resolve 'tailwindcss'" error:**
```bash
# This is fixed - Tailwind CSS has been downgraded to stable v3 and properly configured
# Rebuild containers to install the new dependencies:
docker-compose --profile dev build --no-cache frontend-dev
```

**"npm ci" error - package.json and package-lock.json are out of sync:**
```bash
# This happens when dependencies are updated. Fix by regenerating the lock file:
npm install

# Then rebuild Docker containers:
docker-compose --profile dev build --no-cache frontend-dev
```

**Styles are broken/missing:**
```bash
# This is fixed - CSS has been updated to use proper Tailwind v3 syntax
# If you still see broken styles, rebuild the container:
docker-compose --profile dev build --no-cache frontend-dev
docker-compose --profile dev up frontend-dev
```

**Out of disk space:**
```bash
# Clean up unused Docker resources
docker system prune -a

# Remove specific images
docker rmi cloudhatch-frontend cloudhatch-frontend-dev
```

**Permission issues (Linux/macOS):**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Or run with user ID
docker-compose --profile dev up --build frontend-dev --user $(id -u):$(id -g)
```

## Quick Reference

### Most Common Commands

```bash
# Start development (equivalent to npm run dev)
docker-compose --profile dev up --build frontend-dev

# Start production testing
docker-compose up --build

# Stop containers
docker-compose down

# View logs
docker-compose logs -f frontend-dev

# Rebuild after dependency changes
docker-compose --profile dev build --no-cache frontend-dev
```

### URLs
- **Development:** http://localhost:3001 (hot reload enabled)
- **Production:** http://localhost:3000 (optimized build)

### File Locations
- **Docker config:** `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`
- **Environment:** `env.example` → copy to `.env.local`
- **Source code:** `src/` directory (auto-mounted in development)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Docker Documentation](https://docs.docker.com/) - learn about Docker and containerization.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Docker Deployment

For production deployment with Docker:

```bash
# Build production image
docker build -t cloudhatch-frontend .

# Run in production
docker run -p 3000:3000 -e NODE_ENV=production cloudhatch-frontend
```

Or use Docker Compose in production:

```bash
# Deploy with compose
docker-compose up -d

# Scale if needed
docker-compose up -d --scale frontend=3
```
