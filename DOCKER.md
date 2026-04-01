# Docker Deployment Guide

Run your blockchain using Docker for easy deployment and scalability.

## 🐳 Prerequisites

- Docker installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose installed (included with Docker Desktop)
- Windows, Mac, or Linux system

## 🚀 Quick Start with Docker

### 1. Single Node Deployment

Run a single blockchain node in a container:

```bash
# Build the image
docker build -t blockchain .

# Run the container
docker run -p 3000:3000 -p 8000:8000 blockchain
```

The node will be accessible at:
- REST API: http://localhost:3000
- P2P Network: localhost:8000

### 2. Multi-Node Network with Docker Compose

Run a complete blockchain network with multiple nodes:

```bash
# Start all services
docker-compose up

# Run in background
docker-compose up -d
```

This starts:
- **Node 1**: API on port 3000, P2P on port 8000
- **Node 2**: API on port 3001, P2P on port 8001
- **Node 3**: API on port 3002, P2P on port 8002
- **Dashboard**: Web UI on port 8080

Access:
- Dashboard: http://localhost:8080
- Node 1 API: http://localhost:3000
- Node 2 API: http://localhost:3001
- Node 3 API: http://localhost:3002

### 3. Connect Nodes

After docker-compose starts, connect the nodes:

```bash
# Connect Node 2 to Node 1
curl -X POST http://localhost:3000/network/peers \
  -H "Content-Type: application/json" \
  -d '{
    "peerId": "node2-id",
    "host": "node2",
    "port": 8001
  }'

# Connect Node 3 to Node 1
curl -X POST http://localhost:3000/network/peers \
  -H "Content-Type: application/json" \
  -d '{
    "peerId": "node3-id",
    "host": "node3",
    "port": 8002
  }'
```

## 📋 Docker Commands

### Build Image

```bash
# Build with default name
docker build -t blockchain .

# Build with specific tag
docker build -t blockchain:latest .

# Build with version tag
docker build -t blockchain:v1.0.0 .
```

### Run Container

```bash
# Run with default settings
docker run -p 3000:3000 blockchain

# Run in background
docker run -d -p 3000:3000 blockchain

# Run with environment variables
docker run -d \
  -e DIFFICULTY=2 \
  -e BLOCK_TIME=5000 \
  -p 3000:3000 \
  blockchain

# Run with volume mount for persistence
docker run -d \
  -v blockchain-data:/app/data \
  -p 3000:3000 \
  blockchain

# Run with custom command
docker run -d -p 3000:3000 blockchain npm run dashboard
```

### Container Management

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Stop a container
docker stop <container-id>

# Start a stopped container
docker start <container-id>

# Remove a container
docker rm <container-id>

# View container logs
docker logs <container-id>

# Follow container logs
docker logs -f <container-id>

# Execute command in container
docker exec <container-id> npm run blockchain -- info

# Get container IP
docker inspect <container-id> | grep IPAddress
```

### Docker Compose Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs

# Follow logs for specific service
docker-compose logs -f node1

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove data volumes
docker-compose down -v

# Rebuild images
docker-compose up --build

# Remove built images
docker-compose down --rmi all

# Create specific service
docker-compose up node1

# Stop specific service
docker-compose stop node1

# Restart services
docker-compose restart
```

## 🔧 Configuration with Docker

### Environment Variables

Pass environment variables to containers:

```bash
# Via docker run
docker run -e DIFFICULTY=3 -e API_PORT=3000 blockchain

# Via docker-compose
# Edit docker-compose.yml:
services:
  node1:
    environment:
      - DIFFICULTY=3
      - API_PORT=3000
```

### Available Variables

```env
DIFFICULTY=4              # Mining difficulty
BLOCK_TIME=10000         # Target block time (ms)
REWARD_PER_BLOCK=100     # Mining reward
P2P_HOST=0.0.0.0         # P2P listen host
P2P_PORT=8000            # P2P port
API_PORT=3000            # API port
DASHBOARD_PORT=8080      # Dashboard port
NODE_ENV=production      # Environment
```

## 💾 Persistence

### Volume Mounting

Save blockchain state between container runs:

```bash
# Create volume
docker volume create blockchain-data

# Run with volume
docker run -d \
  -v blockchain-data:/app/data \
  -p 3000:3000 \
  blockchain

# Check volume
docker volume ls
docker volume inspect blockchain-data
```

### In Docker Compose

```yaml
services:
  node1:
    volumes:
      - node1-data:/app/data

volumes:
  node1-data:
    driver: local
```

## 🌐 Networking

### Docker Bridge Network

Containers can communicate by service name:

```yaml
services:
  node1:
    networks:
      - blockchain-net
  node2:
    networks:
      - blockchain-net

networks:
  blockchain-net:
    driver: bridge
```

Inside containers:
- Node 1: `http://node1:3000`
- Node 2: `http://node2:3001`

### External Access

Expose ports to host:

```yaml
services:
  node1:
    ports:
      - "3000:3000"    # HOST:CONTAINER
      - "8000:8000"
```

## 📊 Monitoring

### View Container Status

```bash
docker-compose ps
```

Output:
```
NAME                        COMMAND             STATUS
blockchain-node1           npm run node        Up 2 minutes
blockchain-node2           npm run node        Up 2 minutes
blockchain-dashboard       npm run dashboard  Up 2 minutes
```

### View Live Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f node1

# Last 100 lines
docker-compose logs --tail=100

# Timestamp included
docker-compose logs -f --timestamps
```

### Container Statistics

```bash
# CPU, Memory, Network stats
docker stats

# Specific container
docker stats <container-id>
```

## 🔐 Security Best Practices

### 1. Use Official Base Images

```dockerfile
FROM node:18-alpine  # Verified official image
```

### 2. Run as Non-Root User

```dockerfile
RUN useradd -m app
USER app
```

### 3. Minimal Image Size

```dockerfile
FROM node:18-alpine  # Alpine Linux is ~5MB vs ~900MB
```

### 4. Scan for Vulnerabilities

```bash
docker scan blockchain
```

### 5. Use .dockerignore

Create `.dockerignore`:
```
node_modules
dist
.git
.env
.DS_Store
```

## 🚀 Production Deployment

### 1. Build Production Image

```bash
docker build -t blockchain:1.0.0 .
docker tag blockchain:1.0.0 myregistry/blockchain:1.0.0
```

### 2. Push to Registry

```bash
docker push myregistry/blockchain:1.0.0
```

### 3. Production Docker Compose

```yaml
version: '3.8'

services:
  node:
    image: myregistry/blockchain:1.0.0
    restart: always
    environment:
      - DIFFICULTY=5
      - NODE_ENV=production
    volumes:
      - /data/blockchain:/app/data
    networks:
      - blockchain-net

  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - blockchain-net

networks:
  blockchain-net:
    driver: bridge
```

### 4. Health Checks

Add health check to docker-compose:

```yaml
services:
  node1:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 40s
```

## 🆘 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs <container-id>

# Run interactively to see errors
docker run -it blockchain sh
```

### Port Already in Use

```bash
# Find process using port
docker ps | grep <port>

# Or change Docker port mapping
docker run -p 3001:3000 blockchain
```

### Network Issues

```bash
# Check network
docker network ls
docker network inspect <network-name>

# Check container IP
docker inspect <container-id> | grep IPAddress
```

### High Memory Usage

```bash
# Check container memory
docker stats <container-id>

# Limit memory
docker run -m 512m blockchain

# In docker-compose
services:
  node1:
    mem_limit: 512m
    memswap_limit: 512m
```

## 📚 Examples

### Example 1: Single Node with Custom Config

```bash
docker run -d \
  --name blockchain-node \
  -e DIFFICULTY=2 \
  -e BLOCK_TIME=5000 \
  -e REWARD_PER_BLOCK=50 \
  -p 3000:3000 \
  -p 8000:8000 \
  -v blockchain-data:/app/data \
  blockchain
```

### Example 2: Development Setup

```bash
# Terminal 1: Node
docker run -d \
  --name blockchain-dev \
  -p 3000:3000 \
  blockchain

# Terminal 2: Dashboard
docker run -d \
  --name blockchain-dashboard \
  -p 8080:8080 \
  -e API_URL=http://localhost:3000 \
  blockchain npm run dashboard

# Terminal 3: CLI
docker exec blockchain-dev npm run blockchain -- info
```

### Example 3: Production Cluster

```bash
docker-compose -f docker-compose.yml up -d
```

## 🐳 Docker Registry

### Private Registry

```bash
# Login to registry
docker login myregistry.com

# Tag image
docker tag blockchain:latest myregistry.com/blockchain:latest

# Push
docker push myregistry.com/blockchain:latest

# Pull (for deployment)
docker pull myregistry.com/blockchain:latest
```

## 📖 Resources

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

Your blockchain is now ready for containerized deployment! 🐳
