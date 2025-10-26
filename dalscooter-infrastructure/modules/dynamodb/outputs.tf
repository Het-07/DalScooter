# modules/dynamodb/outputs.tf
# Outputs for use in other modules

output "user_auth_table_arn" {
  description = "ARN of the user authentication DynamoDB table."
  value       = aws_dynamodb_table.user_auth_table.arn
}

output "user_auth_table_name" {
  description = "Name of the user authentication DynamoDB table."
  value       = aws_dynamodb_table.user_auth_table.name
}

# NEW: Outputs for Bikes table
output "bikes_table_arn" {
  description = "ARN of the Bikes DynamoDB table."
  value       = aws_dynamodb_table.bikes_table.arn
}

output "bikes_table_name" {
  description = "Name of the Bikes DynamoDB table."
  value       = aws_dynamodb_table.bikes_table.name
}

# NEW: Outputs for Bookings table
output "bookings_table_arn" {
  description = "ARN of the Bookings DynamoDB table."
  value       = aws_dynamodb_table.bookings_table.arn
}

output "bookings_table_name" {
  description = "Name of the Bookings DynamoDB table."
  value       = aws_dynamodb_table.bookings_table.name
}

# NEW: Outputs for Feedback table
output "feedback_table_arn" {
  description = "ARN of the Feedback DynamoDB table."
  value       = aws_dynamodb_table.feedback_table.arn
}

output "feedback_table_name" {
  description = "Name of the Feedback DynamoDB table."
  value       = aws_dynamodb_table.feedback_table.name
}

output "concern_table_arn"{
  description = "ARN of the Concern DynamoDB table."
  value       = aws_dynamodb_table.customer_concerns.arn
}