#!/bin/bash
# Test script for exporting feedback to S3 via API Gateway
# Usage: ./test_export_feedback.sh <API_GATEWAY_URL> <COGNITO_ID_TOKEN>
# Example: ./test_export_feedback.sh https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod 'eyJraWQ...'

API_URL="$1"
ID_TOKEN="$2"

if [ -z "$API_URL" ] || [ -z "$ID_TOKEN" ]; then
  echo "Usage: $0 <API_GATEWAY_URL> <COGNITO_ID_TOKEN>"
  exit 1
fi

ENDPOINT="$API_URL/admin/export-feedback"

RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json")

MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
S3_URL=$(echo "$RESPONSE" | jq -r '.s3_url')
RECORD_COUNT=$(echo "$RESPONSE" | jq -r '.record_count')

if [ "$MESSAGE" == "null" ]; then
  echo "Raw response: $RESPONSE"
else
  echo "Message: $MESSAGE"
  echo "S3 URL: $S3_URL"
  echo "Record count: $RECORD_COUNT"
fi
