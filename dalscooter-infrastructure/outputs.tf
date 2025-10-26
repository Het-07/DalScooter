# outputs.tf
# Outputs important values needed for the front-end configuration.

output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.cognito.user_pool_id
}

output "client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = module.cognito.client_id
}

output "dynamodb_user_auth_table_name" { # Renamed for clarity
  description = "Name of the DynamoDB user authentication table"
  value       = module.dynamodb.user_auth_table_name
}

# NEW: API Gateway Invoke URL
output "api_gateway_invoke_url" {
  description = "The invoke URL for the DALScooter API Gateway"
  value       = module.api_gateway.api_gateway_invoke_url
}

output "feedback_export_bucket_name" {
  description = "Name of the S3 bucket for feedback export."
  value       = module.s3.feedback_export_bucket_name
}

output "feedback_export_bucket_arn" {
  description = "ARN of the S3 bucket for feedback export."
  value       = module.s3.feedback_export_bucket_arn
}

output "identity_pool_id" {
  value = module.cognito.identity_pool_id
}