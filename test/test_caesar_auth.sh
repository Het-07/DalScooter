#!/bin/bash

# CONFIG - Update this with your Lambda function name
LAMBDA_NAME="CaesarAuthLambda"

# 1️⃣ STEP 1: Invoke Lambda to get Caesar challenge
echo "Requesting challenge..."
RESPONSE=$(aws lambda invoke \
  --function-name "$LAMBDA_NAME" \
  --payload '{"username": "Siva"}' \
  --cli-binary-format raw-in-base64-out \
  response.json > /dev/null && cat response.json)

BODY=$(echo "$RESPONSE" | jq -r '.body' | jq -r)
CHALLENGE=$(echo "$BODY" | jq -r '.challenge')
MESSAGE=$(echo "$BODY" | jq -r '.message')


echo ""
echo "🧩 Challenge: $CHALLENGE"
echo "ℹ️  $MESSAGE"

# 2️⃣ STEP 2: Ask user to solve it
echo ""
read -p "🔐 Enter your decrypted answer for '$CHALLENGE': " ANSWER

# 3️⃣ STEP 3: Verify user's answer
VERIFY_PAYLOAD=$(jq -n \
  --arg username "Siva" \
  --arg challenge "$CHALLENGE" \
  --arg answer "$ANSWER" \
  '{username: $username, challenge: $challenge, answer: $answer}')

echo ""
echo "Verifying answer..."
aws lambda invoke \
  --function-name "$LAMBDA_NAME" \
  --payload "$VERIFY_PAYLOAD" \
  --cli-binary-format raw-in-base64-out \
  verify_response.json > /dev/null

cat verify_response.json
echo ""
