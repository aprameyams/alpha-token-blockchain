# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose ports
EXPOSE 3000 8000 8080

# Default to running the blockchain node
CMD ["npm", "run", "node"]
