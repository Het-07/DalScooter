# modules/cognito/outputs.tf
# Outputs for use in other modules and front-end

output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.dalscooter_user_pool.id
}

output "client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.dalscooter_client.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.dalscooter_user_pool.arn
}

output "franchise_user_group_name" {
  description = "Name of franchise user group"
  value       = aws_cognito_user_group.admin_group.name
}

output "customer_user_group_name" {
  description = "Name of customer user group"
  value       = aws_cognito_user_group.customer_group.name
}

output "identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = aws_cognito_identity_pool.dalscooter_identity_pool.id
}