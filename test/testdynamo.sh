aws dynamodb put-item \
  --table-name user_auth_table \
  --item '{
    "username": {"S": "Siva"},
    "password_hash": {"S": "$2b$10$EXAMPLEHASHEDPW=="},
    "security_questions": {
      "L": [
        {
          "M": {
            "question": {"S": "What is your pet'\''s name?"},
            "answer": {"S": "Fluffy"}
          }
        },
        {
          "M": {
            "question": {"S": "What city were you born in?"},
            "answer": {"S": "Toronto"}
          }
        },
        {
          "M": {
            "question": {"S": "What is your favorite color?"},
            "answer": {"S": "Blue"}
          }
        }
      ]
    },
    "caesar_shift": {"N": "3"}
  }' \
  --region us-east-1
