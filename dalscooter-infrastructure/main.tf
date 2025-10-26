# main.tf
# This is the root Terraform configuration that orchestrates all modules for the DALScooter project.

# Configure the AWS provider
provider "aws" {
  region = var.region
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# DynamoDB module for storing user data and application data (UPDATED)
module "dynamodb" {
  source = "./modules/dynamodb"
}

# Cognito module for user authentication and MFA (EXISTING)
module "cognito" {
  source                           = "./modules/cognito"
  define_auth_challenge_lambda_arn = module.lambda.define_auth_challenge_arn
  create_auth_challenge_lambda_arn = module.lambda.create_auth_challenge_arn
  verify_auth_challenge_lambda_arn = module.lambda.verify_auth_challenge_arn
  post_confirmation_lambda_arn     = module.lambda.post_confirmation_arn
  post_authentication_lambda_arn   = module.lambda.post_authentication_arn
}

# Lambda module for authentication and application logic (UPDATED)
module "lambda" {
  source                    = "./modules/lambda"
  user_pool_arn             = module.cognito.user_pool_arn
  user_pool_id              = module.cognito.user_pool_id
  franchise_user_group_name = module.cognito.franchise_user_group_name
  customer_user_group_name  = module.cognito.customer_user_group_name
  user_auth_table_arn       = module.dynamodb.user_auth_table_arn
  user_auth_table_name      = module.dynamodb.user_auth_table_name
  bikes_table_arn           = module.dynamodb.bikes_table_arn
  bikes_table_name          = module.dynamodb.bikes_table_name
  bookings_table_arn        = module.dynamodb.bookings_table_arn
  bookings_table_name       = module.dynamodb.bookings_table_name
  feedback_table_arn        = module.dynamodb.feedback_table_arn
  feedback_table_name       = module.dynamodb.feedback_table_name
  concern_table_arn         = module.dynamodb.concern_table_arn

  # Pass SQS queue ARN to Lambda module for permissions and triggers
  booking_requests_queue_arn  = module.sns_sqs.booking_requests_queue_arn
  booking_requests_queue_url  = module.sns_sqs.booking_requests_queue_url
  notification_queue_arn      = module.sns_sqs.sqs_queue_arn
  notification_queue_url      = module.sns_sqs.sqs_queue_url
  feedback_export_bucket_arn  = module.s3.feedback_export_bucket_arn
  feedback_export_bucket_name = module.s3.feedback_export_bucket_name

  # BigQuery integration variables - REMOVED (using manual workflow)
  # bigquery_project_id        = var.bigquery_project_id
  # bigquery_dataset_id        = var.bigquery_dataset_id  
  # google_service_account_key = var.google_service_account_key
}

# NEW: API Gateway module for exposing Lambda functions
module "api_gateway" {
  source                          = "./modules/api_gateway"
  user_pool_arn                   = module.cognito.user_pool_arn
  add_bike_lambda                 = module.lambda.add_bike_lambda
  update_bike_lambda              = module.lambda.update_bike_lambda
  get_bike_availability_lambda    = module.lambda.get_bike_availability_lambda
  get_booking_bike_details_lambda = module.lambda.get_booking_bike_details_lambda
  get_admin_stats_lambda          = module.lambda.get_admin_stats_lambda
  reserve_booking_lambda          = module.lambda.reserve_booking_lambda
  get_access_code_lambda          = module.lambda.get_access_code_lambda
  submit_feedback_lambda          = module.lambda.submit_feedback_lambda
  get_booking_history_lambda      = module.lambda.get_booking_history_lambda
  cancel_booking_lambda           = module.lambda.cancel_booking_lambda
  update_booking_lambda           = module.lambda.update_booking_lambda
  export_feedback_to_s3_lambda    = module.lambda.export_feedback_to_s3_lambda
  get_bike_feedback_lambda        = module.lambda.get_bike_feedback_lambda
  get_all_bookings_lambda         = module.lambda.get_all_bookings_lambda
  get_all_bikes_lambda            = module.lambda.get_all_bikes_lambda
  export_dashboard_data_lambda    = module.lambda.export_dashboard_data_lambda
  get_frontend_config_lambda      = module.lambda.get_frontend_config_lambda
  get_all_concerns_lambda         = module.lambda.get_all_concerns_lambda
  raise_concern_lambda            = module.lambda.raise_concern_lambda
  resolve_concern_lambda          = module.lambda.resolve_concern_lambda
  get_concerns_by_bookingId       = module.lambda.get_concerns_by_bookingId 
}

module "s3" {
  source      = "./modules/s3"
  environment = var.environment
}

module "sns_sqs" {
  source                = "./modules/sns_sqs"
  auth_lambda_role_arn  = module.lambda.auth_lambda_role_arn
  send_email_lambda_arn = module.lambda.send_email_lambda_arn
}

# EventBridge module for scheduling automated tasks
module "eventbridge" {
  source                                 = "./modules/eventbridge"
  export_feedback_lambda_arn             = module.lambda.export_feedback_to_s3_lambda.arn
  export_feedback_lambda_name            = module.lambda.export_feedback_to_s3_lambda.function_name
  analyze_feedback_sentiment_lambda_arn  = module.lambda.analyze_feedback_sentiment_lambda.arn
  analyze_feedback_sentiment_lambda_name = module.lambda.analyze_feedback_sentiment_lambda.function_name
  export_dashboard_data_lambda_arn       = module.lambda.export_dashboard_data_lambda.arn
  export_dashboard_data_lambda_name      = module.lambda.export_dashboard_data_lambda.function_name
  # stream_to_bigquery_lambda_arn          = module.lambda.stream_to_bigquery_lambda.arn  # REMOVED
  # stream_to_bigquery_lambda_name         = module.lambda.stream_to_bigquery_lambda.function_name  # REMOVED
}

module "fargate" {
  source               = "./modules/aws-fargate-frontend"
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.client_id
  api_gateway_url      = module.api_gateway.api_gateway_invoke_url
}
