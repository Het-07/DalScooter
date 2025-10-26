# modules/lambda/main.tf
# Configures Lambda functions and IAM roles for authentication, notifications, and application logic.

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# IAM role for all Lambda functions
resource "aws_iam_role" "auth_lambda_exec_role" {
  name = "DALScooterAuthLambdaRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Lambda functions (DynamoDB, Cognito, CloudWatch)
resource "aws_iam_role_policy" "auth_lambda_policy" {
  role = aws_iam_role.auth_lambda_exec_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",      # Added Scan for admin functions, if needed
          "dynamodb:DeleteItem" # If there are delete operations
        ]
        Resource = [
          var.user_auth_table_arn,
          var.bikes_table_arn,
          "${var.bikes_table_arn}/index/*", # For GSI access
          var.bookings_table_arn,
          "${var.bookings_table_arn}/index/*", # For GSI access
          var.feedback_table_arn,
          "${var.feedback_table_arn}/index/*", # For GSI access
          var.concern_table_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminGetUser",
          "cognito-idp:ListUsersInGroup"
        ]
        Resource = var.user_pool_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = [
          var.booking_requests_queue_arn,
          var.notification_queue_arn
        ]
      },
      { # NEW: EventBridge permissions for process_booking_request lambda to create/delete rules
        Effect = "Allow"
        Action = [
          "events:PutRule",
          "events:PutTargets",
          "events:RemoveTargets",
          "events:DeleteRule"
        ]
        Resource = "arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:rule/dals-booking-*" # Specific to our rule names
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          var.feedback_export_bucket_arn,
          "${var.feedback_export_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "comprehend:DetectSentiment"
        ]
        Resource = "*"
      },
    ]
  })
}

data "archive_file" "lambda_zip_auth_challenge" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/authentication/define_auth_challenge.py"
  output_path = "${path.root}/lambda_functions/build/authentication/define_auth_challenge.zip"
}

resource "aws_lambda_function" "define_auth_challenge" {
  function_name    = "DefineAuthChallenge"
  role             = aws_iam_role.auth_lambda_exec_role.arn
  handler          = "define_auth_challenge.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_auth_challenge.output_path
  source_code_hash = data.archive_file.lambda_zip_auth_challenge.output_base64sha256
}

resource "aws_lambda_permission" "define_auth_challenge_permission" {
  statement_id  = "AllowCognitoInvokeDefineAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.define_auth_challenge.function_name
  principal     = "cognito-idp.amazonaws.com"
  # source_arn is intentionally omitted here to resolve circular dependency
}

data "archive_file" "lambda_zip_create_auth_challenge" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/authentication/create_auth_challenge.py"
  output_path = "${path.root}/lambda_functions/build/authentication/create_auth_challenge.zip"
}

resource "aws_lambda_function" "create_auth_challenge" {
  function_name    = "CreateAuthChallenge"
  role             = aws_iam_role.auth_lambda_exec_role.arn
  handler          = "create_auth_challenge.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_create_auth_challenge.output_path
  source_code_hash = data.archive_file.lambda_zip_create_auth_challenge.output_base64sha256
  environment {
    variables = {
      DDB_TABLE = var.user_auth_table_name
    }
  }
}

resource "aws_lambda_permission" "create_auth_challenge_permission" {
  statement_id  = "AllowCognitoInvokeCreateAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_auth_challenge.function_name
  principal     = "cognito-idp.amazonaws.com"
  # source_arn is intentionally omitted here to resolve circular dependency
}

data "archive_file" "lambda_zip_verify_auth_challenge" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/authentication/verify_auth_challenge.py"
  output_path = "${path.root}/lambda_functions/build/authentication/verify_auth_challenge.zip"
}

resource "aws_lambda_function" "verify_auth_challenge" {
  function_name    = "VerifyAuthChallenge"
  role             = aws_iam_role.auth_lambda_exec_role.arn
  handler          = "verify_auth_challenge.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_verify_auth_challenge.output_path
  source_code_hash = data.archive_file.lambda_zip_verify_auth_challenge.output_base64sha256
}

resource "aws_lambda_permission" "verify_auth_challenge_permission" {
  statement_id  = "AllowCognitoInvokeVerifyAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.verify_auth_challenge.function_name
  principal     = "cognito-idp.amazonaws.com"
  # source_arn is intentionally omitted here to resolve circular dependency
}

data "archive_file" "lambda_zip_store_questions" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/authentication/store_questions.py"
  output_path = "${path.root}/lambda_functions/build/authentication/store_questions.zip"
}

resource "aws_lambda_function" "store_questions" {
  function_name    = "StoreQuestions"
  role             = aws_iam_role.auth_lambda_exec_role.arn
  handler          = "store_questions.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_store_questions.output_path
  source_code_hash = data.archive_file.lambda_zip_store_questions.output_base64sha256
  environment {
    variables = {
      DDB_TABLE = var.user_auth_table_name
    }
  }
}

data "archive_file" "lambda_zip_post_confirmation" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/authentication/post_confirmation.py"
  output_path = "${path.root}/lambda_functions/build/authentication/post_confirmation.zip"
}

resource "aws_lambda_function" "post_confirmation" {
  function_name    = "PostConfirmation"
  role             = aws_iam_role.auth_lambda_exec_role.arn
  handler          = "post_confirmation.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_post_confirmation.output_path
  source_code_hash = data.archive_file.lambda_zip_post_confirmation.output_base64sha256
  environment {
    variables = {
      SQS_QUEUE_URL = var.notification_queue_url
    }
  }
}

resource "aws_lambda_permission" "post_confirmation_permission" {
  statement_id  = "AllowCognitoInvokePostConfirm"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  # source_arn is intentionally omitted here to resolve circular dependency
}

data "archive_file" "lambda_zip_post_authentication" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/authentication/post_authentication.py"
  output_path = "${path.root}/lambda_functions/build/authentication/post_authentication.zip"
}

resource "aws_lambda_function" "post_authentication" {
  function_name    = "PostAuthentication"
  role             = aws_iam_role.auth_lambda_exec_role.arn
  handler          = "post_authentication.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_post_authentication.output_path
  source_code_hash = data.archive_file.lambda_zip_post_authentication.output_base64sha256
  environment {
    variables = {
      SQS_QUEUE_URL = var.notification_queue_url
    }
  }
}

resource "aws_lambda_permission" "post_authentication_permission" {
  statement_id  = "AllowCognitoInvokePostAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_authentication.function_name
  principal     = "cognito-idp.amazonaws.com"
  # source_arn is intentionally omitted here to resolve circular dependency
}



# NEW LAMBDA FUNCTIONS FOR BIKE FRANCHISE / ADMIN MODULE

data "archive_file" "lambda_zip_add_bike" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bikes/add_bike.py"
  output_path = "${path.root}/lambda_functions/build/bikes/add_bike.zip"
}

# Lambda for POST /bikes (add_bike)
resource "aws_lambda_function" "add_bike_lambda" {
  function_name    = "dals_add_bike"
  handler          = "add_bike.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_add_bike.output_path
  source_code_hash = data.archive_file.lambda_zip_add_bike.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BIKES_TABLE_NAME = var.bikes_table_name
    }
  }

  tags = {
    Name = "dals_add_bike_lambda"
  }
}

data "archive_file" "lambda_zip_update_bike" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bikes/update_bike.py"
  output_path = "${path.root}/lambda_functions/build/bikes/update_bike.zip"
}

# Lambda for PUT /bikes/{bike_id} (update_bike)
resource "aws_lambda_function" "update_bike_lambda" {
  function_name    = "dals_update_bike"
  handler          = "update_bike.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_update_bike.output_path
  source_code_hash = data.archive_file.lambda_zip_update_bike.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BIKES_TABLE_NAME = var.bikes_table_name
    }
  }

  tags = {
    Name = "dals_update_bike_lambda"
  }
}

data "archive_file" "lambda_zip_get_bike_availability" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bikes/get_bike_availability.py"
  output_path = "${path.root}/lambda_functions/build/bikes/get_bike_availability.zip"
}

# Lambda for GET /bikes/availability (get_bike_availability)
resource "aws_lambda_function" "get_bike_availability_lambda" {
  function_name    = "dals_get_bike_availability"
  handler          = "get_bike_availability.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_bike_availability.output_path
  source_code_hash = data.archive_file.lambda_zip_get_bike_availability.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BIKES_TABLE_NAME    = var.bikes_table_name
      BOOKINGS_TABLE_NAME = var.bookings_table_name
    }
  }

  tags = {
    Name = "dals_get_bike_availability_lambda"
  }
}

data "archive_file" "lambda_zip_get_booking_bike_details" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/admin/get_booking_bike_details.py"
  output_path = "${path.root}/lambda_functions/build/admin/get_booking_bike_details.zip"
}

# Lambda for GET /bookings/{booking_reference_code}/bike-details (get_booking_bike_details)
resource "aws_lambda_function" "get_booking_bike_details_lambda" {
  function_name    = "dals_get_booking_bike_details"
  handler          = "get_booking_bike_details.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_booking_bike_details.output_path
  source_code_hash = data.archive_file.lambda_zip_get_booking_bike_details.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BOOKINGS_TABLE_NAME = var.bookings_table_name
      BIKES_TABLE_NAME    = var.bikes_table_name
    }
  }

  tags = {
    Name = "dals_get_booking_bike_details_lambda"
  }
}

data "archive_file" "lambda_zip_get_admin_stats" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/admin/get_admin_stats.py"
  output_path = "${path.root}/lambda_functions/build/admin/get_admin_stats.zip"
}

# Lambda for GET /admin/stats (get_admin_stats)
resource "aws_lambda_function" "get_admin_stats_lambda" {
  function_name    = "dals_get_admin_stats"
  handler          = "get_admin_stats.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_admin_stats.output_path
  source_code_hash = data.archive_file.lambda_zip_get_admin_stats.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      USERS_TABLE_NAME    = var.user_auth_table_name
      BOOKINGS_TABLE_NAME = var.bookings_table_name
      BIKES_TABLE_NAME    = var.bikes_table_name
      FEEDBACK_TABLE_NAME = var.feedback_table_name
    }
  }

  tags = {
    Name = "dals_get_admin_stats_lambda"
  }
}

data "archive_file" "lambda_zip_export_dashboard_data" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/admin/export_dashboard_data_to_s3.py"
  output_path = "${path.root}/lambda_functions/build/admin/export_dashboard_data_to_s3.zip"
}

# Lambda for automated dashboard data export to S3
resource "aws_lambda_function" "export_dashboard_data_lambda" {
  function_name    = "dals_export_dashboard_data"
  handler          = "export_dashboard_data_to_s3.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_export_dashboard_data.output_path
  source_code_hash = data.archive_file.lambda_zip_export_dashboard_data.output_base64sha256
  timeout          = 300 # 5 minutes for data processing
  memory_size      = 256 # More memory for CSV processing
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      USERS_TABLE_NAME            = var.user_auth_table_name
      BOOKINGS_TABLE_NAME         = var.bookings_table_name
      BIKES_TABLE_NAME            = var.bikes_table_name
      FEEDBACK_TABLE_NAME         = var.feedback_table_name
      FEEDBACK_EXPORT_BUCKET_NAME = var.feedback_export_bucket_name
    }
  }

  tags = {
    Name = "dals_export_dashboard_data_lambda"
  }
}

# Note: BigQuery streaming components removed 
# Using manual BigQuery workflow with refresh_bigquery_data.sh script instead

# NEW LAMBDA FUNCTIONS FOR BOOKING/RESERVATION MODULE


data "archive_file" "lambda_zip_reserve_booking" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/reserve_booking.py"
  output_path = "${path.root}/lambda_functions/build/bookings/reserve_booking.zip"
}

# Lambda for POST /bookings/reserve
resource "aws_lambda_function" "reserve_booking_lambda" {
  function_name    = "dals_reserve_booking"
  handler          = "reserve_booking.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_reserve_booking.output_path
  source_code_hash = data.archive_file.lambda_zip_reserve_booking.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BOOKINGS_TABLE_NAME        = var.bookings_table_name
      BIKES_TABLE_NAME           = var.bikes_table_name
      BOOKING_REQUESTS_QUEUE_URL = var.booking_requests_queue_url
      NOTIFICATION_QUEUE_URL     = var.notification_queue_url
    }
  }

  tags = {
    Name = "dals_reserve_booking_lambda"
  }
}

# --- Archive data sources for booking-related Lambdas ---

data "archive_file" "lambda_zip_get_access_code" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/get_access_code.py"
  output_path = "${path.root}/lambda_functions/build/bookings/get_access_code.zip"
}

data "archive_file" "lambda_zip_submit_feedback" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/submit_feedback.py"
  output_path = "${path.root}/lambda_functions/build/bookings/submit_feedback.zip"
}

data "archive_file" "lambda_zip_get_booking_history" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/get_booking_history.py"
  output_path = "${path.root}/lambda_functions/build/bookings/get_booking_history.zip"
}

data "archive_file" "lambda_zip_cancel_booking" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/cancel_booking.py"
  output_path = "${path.root}/lambda_functions/build/bookings/cancel_booking.zip"
}

data "archive_file" "lambda_zip_update_booking" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/update_booking.py"
  output_path = "${path.root}/lambda_functions/build/bookings/update_booking.zip"
}

# --- Lambda resources using the above archives ---

resource "aws_lambda_function" "get_access_code_lambda" {
  function_name    = "dals_get_access_code"
  handler          = "get_access_code.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_access_code.output_path
  source_code_hash = data.archive_file.lambda_zip_get_access_code.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BOOKINGS_TABLE_NAME = var.bookings_table_name
    }
  }

  tags = {
    Name = "dals_get_access_code_lambda"
  }
}

resource "aws_lambda_function" "submit_feedback_lambda" {
  function_name    = "dals_submit_feedback"
  handler          = "submit_feedback.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_submit_feedback.output_path
  source_code_hash = data.archive_file.lambda_zip_submit_feedback.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      FEEDBACK_TABLE_NAME = var.feedback_table_name
    }
  }

  tags = {
    Name = "dals_submit_feedback_lambda"
  }
}

resource "aws_lambda_function" "get_booking_history_lambda" {
  function_name    = "dals_get_booking_history"
  handler          = "get_booking_history.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_booking_history.output_path
  source_code_hash = data.archive_file.lambda_zip_get_booking_history.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BOOKINGS_TABLE_NAME = var.bookings_table_name
      BIKES_TABLE_NAME    = var.bikes_table_name
    }
  }

  tags = {
    Name = "dals_get_booking_history_lambda"
  }
}

resource "aws_lambda_function" "cancel_booking_lambda" {
  function_name    = "dals_cancel_booking"
  handler          = "cancel_booking.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_cancel_booking.output_path
  source_code_hash = data.archive_file.lambda_zip_cancel_booking.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BOOKINGS_TABLE_NAME = var.bookings_table_name
      BIKES_TABLE_NAME    = var.bikes_table_name
    }
  }

  tags = {
    Name = "dals_cancel_booking_lambda"
  }
}

resource "aws_lambda_function" "update_booking_lambda" {
  function_name    = "dals_update_booking"
  handler          = "update_booking.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_update_booking.output_path
  source_code_hash = data.archive_file.lambda_zip_update_booking.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BOOKINGS_TABLE_NAME = var.bookings_table_name
      BIKES_TABLE_NAME    = var.bikes_table_name
    }
  }

  tags = {
    Name = "dals_update_booking_lambda"
  }
}

#Concern lambdas

data "archive_file" "lambda_zip_raise_concern" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/concern/raise_concern.py"
  output_path = "${path.root}/lambda_functions/build/concern/raise_concern.zip"
}

resource "aws_lambda_function" "raise_concern_lambda" {
  function_name    = "dals_raise_concern"
  handler          = "raise_concern.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_raise_concern.output_path
  source_code_hash = data.archive_file.lambda_zip_raise_concern.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      USER_POOL_ID              = var.user_pool_id
      FRANCHISE_USER_GROUP_NAME = var.franchise_user_group_name
    }
  }

  tags = {
    Name = "dals_raise_concern_lambda"
  }
}


data "archive_file" "lambda_zip_get_all_concerns" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/concern/get_all_concerns.py"
  output_path = "${path.root}/lambda_functions/build/concern/get_all_concerns.zip"
}

resource "aws_lambda_function" "get_all_concerns_lambda" {
  function_name    = "dals_get_all_concerns"
  handler          = "get_all_concerns.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_all_concerns.output_path
  source_code_hash = data.archive_file.lambda_zip_get_all_concerns.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  tags = {
    Name = "dals_get_all_concerns"
  }
}

data "archive_file" "lambda_zip_get_concerns_by_bookingId" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/concern/get_concerns_by_bookingId.py"
  output_path = "${path.root}/lambda_functions/build/concern/get_concerns_by_bookingId.zip"
}

resource "aws_lambda_function" "get_concerns_by_bookingId_lambda" {
  function_name    = "dals_get_concerns_by_bookingId"
  handler          = "get_concerns_by_bookingId.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_concerns_by_bookingId.output_path
  source_code_hash = data.archive_file.lambda_zip_get_concerns_by_bookingId.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  tags = {
    Name = "dals_get_concerns_by_bookingId"
  }
}


data "archive_file" "lambda_zip_resolve_concern" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/concern/resolve_concern.py"
  output_path = "${path.root}/lambda_functions/build/concern/resolve_concern.zip"
}

resource "aws_lambda_function" "resolve_concern_lambda" {
  function_name    = "dals_resolve_concern"
  handler          = "resolve_concern.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_resolve_concern.output_path
  source_code_hash = data.archive_file.lambda_zip_resolve_concern.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  tags = {
    Name = "dals_resolve_concern_lambda"
  }
}

data "archive_file" "lambda_zip_process_booking_request" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/process_booking_request.py"
  output_path = "${path.root}/lambda_functions/build/bookings/process_booking_request.zip"
}

# NEW: Lambda function for processing SQS booking requests
resource "aws_lambda_function" "process_booking_request_lambda" {
  function_name    = "dals_process_booking_request"
  handler          = "process_booking_request.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_process_booking_request.output_path
  source_code_hash = data.archive_file.lambda_zip_process_booking_request.output_base64sha256
  timeout          = 60 # Allow more time for processing multiple SQS messages
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn # Reusing the existing role

  environment {
    variables = {
      BOOKINGS_TABLE_NAME                = var.bookings_table_name
      BIKES_TABLE_NAME                   = var.bikes_table_name
      SCHEDULED_STATUS_UPDATE_LAMBDA_ARN = aws_lambda_function.update_bike_status_on_schedule_lambda.arn
      USER_POOL_ID                       = var.user_pool_id
      NOTIFICATION_QUEUE_URL             = var.notification_queue_url
    }
  }

  tags = {
    Name = "dals_process_booking_request_lambda"
  }
}

# SQS Event Source Mapping for process_booking_request_lambda
resource "aws_lambda_event_source_mapping" "process_booking_request_sqs_trigger" {
  event_source_arn = var.booking_requests_queue_arn
  function_name    = aws_lambda_function.process_booking_request_lambda.arn
  batch_size       = 1 # Process one message at a time for simpler debugging/logic
  enabled          = true
  # REMOVED: FIFO-specific attributes like batch_window and source_access_configuration
}

resource "aws_lambda_event_source_mapping" "notification_lambda_sqs_trigger" {
  event_source_arn = var.notification_queue_arn
  function_name    = aws_lambda_function.send_email.arn
  batch_size       = 1 # Process one message at a time for simpler debugging/logic
  enabled          = true
}

data "archive_file" "lambda_zip_update_bike_status_on_schedule" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bikes/update_bike_status_on_schedule.py"
  output_path = "${path.root}/lambda_functions/build/bikes/update_bike_status_on_schedule.zip"
}

resource "aws_lambda_function" "update_bike_status_on_schedule_lambda" {
  function_name    = "dals_update_bike_status_on_schedule"
  handler          = "update_bike_status_on_schedule.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_update_bike_status_on_schedule.output_path
  source_code_hash = data.archive_file.lambda_zip_update_bike_status_on_schedule.output_base64sha256
  timeout          = 60
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BIKES_TABLE_NAME    = var.bikes_table_name
      BOOKINGS_TABLE_NAME = var.bookings_table_name
    }
  }

  tags = {
    Name = "dals_update_bike_status_on_schedule_lambda"
  }
}

# NEW: Permission for EventBridge to invoke update_bike_status_on_schedule_lambda
resource "aws_lambda_permission" "allow_events_to_invoke_update_bike_status" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_bike_status_on_schedule_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = "arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:rule/dals-booking-*"
}

data "archive_file" "lambda_zip_check_and_complete_bookings" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/check_and_complete_bookings.py"
  output_path = "${path.root}/lambda_functions/build/bookings/check_and_complete_bookings.zip"
}

# NEW: Lambda function for checking and completing expired bookings (recurring)
resource "aws_lambda_function" "check_and_complete_bookings_lambda" {
  function_name    = "dals_check_and_complete_bookings"
  handler          = "check_and_complete_bookings.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_check_and_complete_bookings.output_path
  source_code_hash = data.archive_file.lambda_zip_check_and_complete_bookings.output_base64sha256
  timeout          = 60
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BOOKINGS_TABLE_NAME = var.bookings_table_name
      BIKES_TABLE_NAME    = var.bikes_table_name
    }
  }

  tags = {
    Name = "dals_check_and_complete_bookings_lambda"
  }
}

# NEW: EventBridge Rule for recurring check_and_complete_bookings
resource "aws_cloudwatch_event_rule" "check_and_complete_bookings_rule" {
  name                = "dals-check-and-complete-bookings-rule"
  schedule_expression = "rate(5 minutes)" # User-defined schedule
  state               = "ENABLED"

  tags = {
    Project = "DALScooter"
  }
}

# NEW: EventBridge Target to invoke check_and_complete_bookings_lambda
resource "aws_cloudwatch_event_target" "check_and_complete_bookings_target" {
  rule      = aws_cloudwatch_event_rule.check_and_complete_bookings_rule.name
  arn       = aws_lambda_function.check_and_complete_bookings_lambda.arn
  target_id = "dals_check_and_complete_bookings_target"
}

# NEW: Permission for EventBridge to invoke check_and_complete_bookings_lambda
resource "aws_lambda_permission" "allow_events_to_invoke_check_and_complete_bookings" {
  statement_id  = "AllowExecutionFromEventBridgeRecurring"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.check_and_complete_bookings_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.check_and_complete_bookings_rule.arn
}


# ... (existing bike franchise/admin lambdas) ...


#SES Lambda Configuration

resource "aws_iam_role" "ses_lambda_exec_role" {
  name = "ses_lambda_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}


resource "aws_iam_role_policy" "ses_lambda_policy" {
  name = "lambda-ses-policy"
  role = aws_iam_role.ses_lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "sqs:*"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "lambda_zip_send_email" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/notification/send_email.py"
  output_path = "${path.root}/lambda_functions/build/notification/send_email.zip"
}

resource "aws_lambda_function" "send_email" {
  function_name = "notification-lambda"
  role          = aws_iam_role.ses_lambda_exec_role.arn
  runtime       = "python3.12"
  handler       = "send_email.lambda_handler"
  timeout       = 10

  filename         = data.archive_file.lambda_zip_send_email.output_path
  source_code_hash = data.archive_file.lambda_zip_send_email.output_base64sha256
}

data "archive_file" "lambda_zip_export_feedback_to_s3" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/export_feedback_to_s3.py"
  output_path = "${path.root}/lambda_functions/build/bookings/export_feedback_to_s3.zip"
}

resource "aws_lambda_function" "export_feedback_to_s3_lambda" {
  function_name    = "dals_export_feedback_to_s3"
  handler          = "export_feedback_to_s3.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_export_feedback_to_s3.output_path
  source_code_hash = data.archive_file.lambda_zip_export_feedback_to_s3.output_base64sha256
  timeout          = 60
  memory_size      = 256
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      FEEDBACK_TABLE_NAME    = var.feedback_table_name
      FEEDBACK_EXPORT_BUCKET = var.feedback_export_bucket_name
    }
  }

  tags = {
    Name = "dals_export_feedback_to_s3_lambda"
  }
}

data "archive_file" "lambda_zip_get_bike_feedback_lambda" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/feedback/get_bike_feedback.py"
  output_path = "${path.root}/lambda_functions/build/feedback/get_bike_feedback.zip"
}

resource "aws_lambda_function" "get_bike_feedback_lambda" {
  function_name    = "dals_get_bike_feedback"
  handler          = "get_bike_feedback.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_bike_feedback_lambda.output_path
  source_code_hash = data.archive_file.lambda_zip_get_bike_feedback_lambda.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      FEEDBACK_TABLE_NAME = var.feedback_table_name
    }
  }

  tags = {
    Name = "dals_get_bike_feedback_lambda"
  }
}


data "archive_file" "lambda_zip_analyze_feedback_sentiment" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/feedback/analyze_feedback_sentiment.py"
  output_path = "${path.root}/lambda_functions/build/feedback/analyze_feedback_sentiment.zip"
}

resource "aws_lambda_function" "analyze_feedback_sentiment_lambda" {
  function_name    = "dals_analyze_feedback_sentiment"
  handler          = "analyze_feedback_sentiment.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_analyze_feedback_sentiment.output_path
  source_code_hash = data.archive_file.lambda_zip_analyze_feedback_sentiment.output_base64sha256
  timeout          = 60
  memory_size      = 256

  role = aws_iam_role.auth_lambda_exec_role.arn
  environment {
    variables = {
      FEEDBACK_TABLE_NAME = var.feedback_table_name
    }
  }
  tags = {
    Name = "dals_analyze_feedback_sentiment_lambda"
  }
}

data "archive_file" "lambda_zip_get_all_bookings_lambda" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bookings/get_all_bookings.py"
  output_path = "${path.root}/lambda_functions/build/bookings/get_all_bookings.zip"
}

resource "aws_lambda_function" "get_all_bookings_lambda" {
  function_name    = "dals_get_all_bookings"
  handler          = "get_all_bookings.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_all_bookings_lambda.output_path
  source_code_hash = data.archive_file.lambda_zip_get_all_bookings_lambda.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn

  environment {
    variables = {
      BOOKINGS_TABLE_NAME = var.bookings_table_name
    }
  }

  tags = {
    Name = "dals_get_all_bookings_lambda"
  }
}

data "archive_file" "lambda_zip_get_all_bikes_lambda" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/bikes/get_all_bikes.py"
  output_path = "${path.root}/lambda_functions/build/bikes/get_all_bikes.zip"
}

# Get All Bikes Lambda
resource "aws_lambda_function" "get_all_bikes_lambda" {
  function_name    = "DALScooterGetAllBikes"
  handler          = "get_all_bikes.lambda_handler"
  runtime          = "python3.11" # Or your preferred Python runtime
  filename         = data.archive_file.lambda_zip_get_all_bikes_lambda.output_path
  source_code_hash = data.archive_file.lambda_zip_get_all_bikes_lambda.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.auth_lambda_exec_role.arn
  environment {
    variables = {
      BIKES_TABLE_NAME = var.bikes_table_name
    }
  }

  tags = {
    Project = "DALScooter"
  }
}

# Lambda for getting frontend configuration (Looker Studio URL, S3 URL, etc)
data "archive_file" "lambda_zip_get_frontend_config" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/admin/get_frontend_config.py"
  output_path = "${path.root}/lambda_functions/build/admin/get_frontend_config.zip"
}

resource "aws_iam_policy" "config_lambda_policy" {
  name        = "dals_config_lambda_policy"
  description = "IAM policy for the frontend config Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/dalscooter/*"
      }
    ]
  })
}

resource "aws_iam_role" "config_lambda_role" {
  name = "dals_config_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config_lambda_policy_attachment" {
  role       = aws_iam_role.config_lambda_role.name
  policy_arn = aws_iam_policy.config_lambda_policy.arn
}

resource "aws_lambda_function" "get_frontend_config_lambda" {
  function_name    = "dals_get_frontend_config"
  handler          = "get_frontend_config.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip_get_frontend_config.output_path
  source_code_hash = data.archive_file.lambda_zip_get_frontend_config.output_base64sha256
  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.config_lambda_role.arn

  environment {
    variables = {
      FEEDBACK_EXPORT_BUCKET = var.feedback_export_bucket_name
    }
  }

  tags = {
    Name = "dals_get_frontend_config_lambda"
  }
}

data "archive_file" "lambda_zip_lex_intent_handler" {
  type        = "zip"
  source_file = "${path.root}/lambda_functions/intent/lex_intent_handler.py"
  output_path = "${path.root}/lambda_functions/build/intent/lex_intent_handler.zip"
}

resource "aws_lambda_function" "lex_intent_handler" {
  function_name = "lex_intent_handler"
  filename      = data.archive_file.lambda_zip_lex_intent_handler.output_path
  source_code_hash = data.archive_file.lambda_zip_lex_intent_handler.output_base64sha256
  handler       = "lex_intent_handler.lambda_handler"
  runtime       = "python3.12"
  role = aws_iam_role.auth_lambda_exec_role.arn

  timeout      = 10
  memory_size  = 128

  environment {
    variables = {
      RAISE_CONCERN_LAMBDA_NAME = aws_lambda_function.raise_concern_lambda.function_name
    }
  }
}


resource "aws_lambda_permission" "lex_invoke_intent_lambda" {
  statement_id  = "AllowLexInvokeIntentHandler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lex_intent_handler.function_name
  principal     = "lex.amazonaws.com"
  source_arn    = "arn:aws:lex:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:bot/OEPNW9GLMQ/alias/TSTALIASID"
}