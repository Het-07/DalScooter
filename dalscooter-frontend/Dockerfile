# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./ 
RUN npm install 

COPY . .

RUN npm run build 

# Stage 2: Serve the application with Nginx and runtime env injection
FROM nginx:stable-alpine

# Copy the Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom entrypoint script for environment variable injection
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Fix the line endings and give it execution permissions
RUN dos2unix /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Use the custom entrypoint script that injects environment variables at runtime
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start Nginx after environment variables are injected
CMD ["nginx", "-g", "daemon off;"]