# modules/cognito/main.tf
# Configures AWS Cognito for user authentication with custom MFA.

# Cognito User Pool for user management
resource "aws_cognito_user_pool" "dalscooter_user_pool" {
  name = "DALScooterUserPool"

  # Password policy to enforce strong passwords
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  username_attributes = ["email"]          # Use email as username
  auto_verified_attributes = ["email"]     # Automatically send email verification

  # Define user attributes
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
  }

  schema {
    name                     = "userType"
    attribute_data_type      = "String"
    mutable                  = true
    required            = false
  }
  schema {
    name                = "questions"
    attribute_data_type = "String"
    mutable             = true
    required            = false
    string_attribute_constraints {
      max_length = 2048  # Ensure enough space for JSON string
    }
  }

  # Link Lambda functions for custom MFA and post-authentication
  lambda_config {
    define_auth_challenge        = var.define_auth_challenge_lambda_arn
    create_auth_challenge        = var.create_auth_challenge_lambda_arn
    verify_auth_challenge_response = var.verify_auth_challenge_lambda_arn
    post_confirmation            = var.post_confirmation_lambda_arn
    post_authentication          = var.post_authentication_lambda_arn
  }

  # Email configuration for verification emails
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  tags = {
    Project = "DALScooter"
  }
}

# Cognito User Pool Client for the front-end
resource "aws_cognito_user_pool_client" "dalscooter_client" {
  name         = "DALScooterClient"
  user_pool_id = aws_cognito_user_pool.dalscooter_user_pool.id
  explicit_auth_flows = [
    "ALLOW_CUSTOM_AUTH",              # Enable custom MFA flow
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

# Cognito User Groups for Customer and Franchise roles
resource "aws_cognito_user_group" "customer_group" {
  name         = "CustomerGroup"
  user_pool_id = aws_cognito_user_pool.dalscooter_user_pool.id
  description  = "Group for registered customers"
}

resource "aws_cognito_user_group" "admin_group" {
  name         = "AdminGroup"
  user_pool_id = aws_cognito_user_pool.dalscooter_user_pool.id
  description  = "Group for franchise operators"
}

# --- Cognito Identity Pool for Guest Access to Lex ---
resource "aws_cognito_identity_pool" "dalscooter_identity_pool" {
  identity_pool_name               = "DALScooterIdentityPool"
  allow_unauthenticated_identities = true

  cognito_identity_providers {
    client_id     = aws_cognito_user_pool_client.dalscooter_client.id
    provider_name = "cognito-idp.us-east-1.amazonaws.com/${aws_cognito_user_pool.dalscooter_user_pool.id}"
    server_side_token_check = false
  }
}


# --- IAM Role for Unauthenticated Guest Users ---
resource "aws_iam_role" "unauthenticated_role" {
  name = "DALScooterUnauthenticatedRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.dalscooter_identity_pool.id
          },
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "unauthenticated_policy" {
  name = "DALScooterUnauthPolicy"
  role = aws_iam_role.unauthenticated_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "lex:RecognizeText",
          "lex:RecognizeUtterance"
        ],
        Resource = "*"
      }
    ]
  })
}

# --- Attach Roles to Identity Pool ---
resource "aws_cognito_identity_pool_roles_attachment" "identity_roles" {
  identity_pool_id = aws_cognito_identity_pool.dalscooter_identity_pool.id

  roles = {
    "unauthenticated" = aws_iam_role.unauthenticated_role.arn
  }
}