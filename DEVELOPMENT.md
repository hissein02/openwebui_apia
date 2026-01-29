# Development Guide

This guide explains how to set up and run the project locally for development.

## Prerequisites

- **Node.js** v20.19.0 or higher (recommended to use [nvm](https://github.com/nvm-sh/nvm))
- **Python** 3.11 (required, not 3.12 or 3.13)
- **npm** v6+

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd openwebui_apia
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set your Ollama server URL:

```env
# Point to your Ollama server (remote or local)
OLLAMA_BASE_URL='http://YOUR_OLLAMA_SERVER:11434'

# Optional: OpenAI API configuration
OPENAI_API_BASE_URL=''
OPENAI_API_KEY=''
```

### 3. Install Frontend Dependencies

```bash
# Use the correct Node.js version
nvm use 20.19.0  # or install with: nvm install 20.19.0

# Install dependencies (use --legacy-peer-deps to resolve conflicts)
npm ci --legacy-peer-deps
```

### 4. Build Frontend (First Time Only)

This step is required to generate static assets for the backend:

```bash
npm run build
```

### 5. Install Backend Dependencies

```bash
cd backend

# Create Python 3.11 virtual environment
python3.11 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 6. Run the Development Servers

You need **two terminal windows**:

#### macOS / Linux

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate
./dev.sh
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

#### Windows (PowerShell or Command Prompt)

**Terminal 1 - Backend:**

```powershell
cd backend
.\venv\Scripts\activate
python -m uvicorn open_webui.main:app --host 0.0.0.0 --port 8080 --reload
```

**Terminal 2 - Frontend:**

```powershell
npm run dev
```

> **Note for Windows users:**
> - Use PowerShell or Command Prompt (not Git Bash for the backend)
> - If you get execution policy errors in PowerShell, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
> - Make sure Python 3.11 is in your PATH

---

The backend will run on `http://localhost:8080`

The frontend will run on `http://localhost:5173`

### 7. Access the Application

Open your browser and go to: **http://localhost:5173**

## Development Workflow

### Hot Reloading

- **Frontend changes** (Svelte/TypeScript): Automatically refreshed in the browser
- **Backend changes** (Python): Server automatically restarts

### Project Structure

```
├── src/                    # Frontend (Svelte/SvelteKit)
│   ├── lib/               # Components, utilities, stores
│   └── routes/            # Page routes
├── backend/               # Backend (Python/FastAPI)
│   └── open_webui/        # Main application
│       ├── main.py        # FastAPI entry point
│       ├── routers/       # API endpoints
│       └── models/        # Database models
├── static/                # Static assets
├── build/                 # Built frontend (generated)
├── .env                   # Environment configuration
└── docker-compose.yaml    # Docker configuration
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server with hot-reload |
| `npm run build` | Build frontend for production |
| `npm run check` | Run TypeScript/Svelte type checking |
| `npm run lint` | Run linter |
| `./backend/dev.sh` | Start backend dev server |

## Troubleshooting

### Node.js Version Issues

If you see errors about Node.js version:

```bash
nvm install 20.19.0
nvm use 20.19.0
```

### Python Version Issues

Make sure you're using Python 3.11:

```bash
python3.11 --version  # Should show 3.11.x
```

### Static Files Not Loading

If favicon or other static files don't load, rebuild the frontend:

```bash
npm run build
# Then restart the backend
```

### Connection to Ollama Failed

Check that your `.env` has the correct `OLLAMA_BASE_URL` pointing to a running Ollama instance.

## Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### Configuration

Create or update your `.env` file with Docker-specific settings:

```env
# Required: Your remote Ollama server
OLLAMA_BASE_URL=http://YOUR_OLLAMA_SERVER:11434

# App name
WEBUI_NAME=APIA

# Port to expose (default: 3000)
APIA_PORT=3000

# Docker image naming (for pushing to registry)
DOCKER_IMAGE_NAME=yourusername/apia
DOCKER_IMAGE_TAG=latest
```

### Build the Docker Image

```bash
# Build using docker-compose
docker-compose build

# Or build manually with custom tag
docker build -t apia:latest .
```

### Run with Docker

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background (detached)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Access the app at: **http://localhost:3000**

### Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag and push
docker tag apia:latest yourusername/apia:latest
docker push yourusername/apia:latest

# Also tag with version
docker tag apia:latest yourusername/apia:v1.0.0
docker push yourusername/apia:v1.0.0
```

### Share with Others

Others can run your image with a simple command:

```bash
docker run -d \
  --name apia \
  -p 3000:8080 \
  -e OLLAMA_BASE_URL=http://their-ollama-server:11434 \
  -v apia-data:/app/backend/data \
  yourusername/apia:latest
```

Or with a `docker-compose.yaml`:

```yaml
services:
  apia:
    image: yourusername/apia:latest
    ports:
      - 3000:8080
    environment:
      - OLLAMA_BASE_URL=http://YOUR_OLLAMA_SERVER:11434
      - WEBUI_NAME=APIA
    volumes:
      - apia-data:/app/backend/data
    restart: unless-stopped

volumes:
  apia-data: {}
```

### Docker Commands Reference

| Command | Description |
|---------|-------------|
| `docker-compose build` | Build the image |
| `docker-compose up` | Start container |
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop and remove container |
| `docker-compose logs -f` | View live logs |
| `docker-compose push` | Push to registry |
| `docker system prune` | Clean up unused images |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Ollama server URL |
| `WEBUI_NAME` | `APIA` | App display name |
| `WEBUI_SECRET_KEY` | (empty) | Secret key for sessions |
| `WEBUI_PORT` | `3000` | Host port to expose |
