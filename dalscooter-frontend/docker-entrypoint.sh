#!/bin/sh

# Docker entrypoint script for runtime environment variable injection
# This script runs before Nginx starts and creates a JavaScript configuration file
# that exposes environment variables to the frontend application.

set -e

echo "🚀 Starting DALScooter Frontend with environment variable injection..."

# Path to Nginx HTML directory
NGINX_HTML_PATH="/usr/share/nginx/html"

# Ensure the directory exists
mkdir -p "$NGINX_HTML_PATH"

# Create the runtime environment configuration file
echo "📝 Creating runtime environment configuration..."

cat > "$NGINX_HTML_PATH/env-config.js" << EOF
// Runtime environment configuration
// This file is generated at container startup by docker-entrypoint.sh
window.env = {
  VITE_AWS_REGION: "${AWS_REGION:-us-east-1}",
  VITE_COGNITO_USER_POOL_ID: "${COGNITO_USER_POOL_ID}",
  VITE_COGNITO_CLIENT_ID: "${COGNITO_CLIENT_ID}",
  VITE_API_GATEWAY_URL: "${API_GATEWAY_URL}"
};

console.log("🔧 Runtime environment configuration loaded:", window.env);
EOF

echo "✅ Environment configuration created at: $NGINX_HTML_PATH/env-config.js"

# Log the injected environment variables (without sensitive data)
echo "🔍 Environment variables injected:"
echo "  - AWS_REGION: ${AWS_REGION:-us-east-1}"
echo "  - COGNITO_USER_POOL_ID: ${COGNITO_USER_POOL_ID:+[SET]}"
echo "  - COGNITO_CLIENT_ID: ${COGNITO_CLIENT_ID:+[SET]}"
echo "  - API_GATEWAY_URL: ${API_GATEWAY_URL:+[SET]}"

# Validate that required environment variables are set
missing_vars=""
if [ -z "$COGNITO_USER_POOL_ID" ]; then
    missing_vars="$missing_vars COGNITO_USER_POOL_ID"
fi
if [ -z "$COGNITO_CLIENT_ID" ]; then
    missing_vars="$missing_vars COGNITO_CLIENT_ID"
fi
if [ -z "$API_GATEWAY_URL" ]; then
    missing_vars="$missing_vars API_GATEWAY_URL"
fi

if [ -n "$missing_vars" ]; then
    echo "⚠️  WARNING: The following required environment variables are not set:$missing_vars"
    echo "   The application may not function correctly without these values."
fi

echo "🌐 Starting Nginx server..."

# Execute the original command (usually nginx)
exec "$@"