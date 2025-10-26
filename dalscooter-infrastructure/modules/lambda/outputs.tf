# modules/lambda/outputs.tf
# Outputs for Lambda ARNs

output "auth_lambda_role_arn" {
  description = "ARN of Auth Lambda Role"
  value       = aws_iam_role.auth_lambda_exec_role.arn
}

output "ses_lambda_role_arn" {
  description = "ARN of SES Lambda Role"
  value       = aws_iam_role.ses_lambda_exec_role.arn
}

output "define_auth_challenge_arn" {
  description = "ARN of the DefineAuthChallenge Lambda"
  value       = aws_lambda_function.define_auth_challenge.arn
}

output "create_auth_challenge_arn" {
  description = "ARN of the CreateAuthChallenge Lambda"
  value       = aws_lambda_function.create_auth_challenge.arn
}

output "verify_auth_challenge_arn" {
  description = "ARN of the VerifyAuthChallengeResponse Lambda"
  value       = aws_lambda_function.verify_auth_challenge.arn
}

output "post_confirmation_arn" {
  description = "ARN of the PostConfirmation Lambda"
  value       = aws_lambda_function.post_confirmation.arn
}

output "post_authentication_arn" {
  description = "ARN of the PostAuthentication Lambda"
  value       = aws_lambda_function.post_authentication.arn
}

output "send_email_lambda_arn" {
  description = "ARN of the SendEmail Lambda"
  value       = aws_lambda_function.send_email.arn
}

# NEW: Outputs for application Lambda functions
output "add_bike_lambda" {
  description = "The add_bike Lambda function object."
  value       = aws_lambda_function.add_bike_lambda
}

output "update_bike_lambda" {
  description = "The update_bike Lambda function object."
  value       = aws_lambda_function.update_bike_lambda
}

output "get_bike_availability_lambda" {
  description = "The get_bike_availability Lambda function object."
  value       = aws_lambda_function.get_bike_availability_lambda
}

output "get_booking_bike_details_lambda" {
  description = "The get_booking_bike_details Lambda function object."
  value       = aws_lambda_function.get_booking_bike_details_lambda
}

output "get_admin_stats_lambda" {
  description = "The get_admin_stats Lambda function object."
  value       = aws_lambda_function.get_admin_stats_lambda
}

output "export_dashboard_data_lambda" {
  description = "The export_dashboard_data Lambda function object."
  value       = aws_lambda_function.export_dashboard_data_lambda
}

# BigQuery Lambda output removed - using manual workflow
# output "stream_to_bigquery_lambda" {
#   description = "The stream_to_bigquery Lambda function object."
#   value       = aws_lambda_function.stream_to_bigquery_lambda
# }

output "reserve_booking_lambda" {
  description = "The reserve_booking Lambda function object."
  value       = aws_lambda_function.reserve_booking_lambda
}

output "get_access_code_lambda" {
  description = "The get_access_code Lambda function object."
  value       = aws_lambda_function.get_access_code_lambda
}

output "submit_feedback_lambda" {
  description = "The submit_feedback Lambda function object."
  value       = aws_lambda_function.submit_feedback_lambda
}

output "get_booking_history_lambda" {
  description = "The get_booking_history Lambda function object."
  value       = aws_lambda_function.get_booking_history_lambda
}

output "cancel_booking_lambda" {
  description = "The cancel_booking Lambda function object."
  value       = aws_lambda_function.cancel_booking_lambda
}

output "update_booking_lambda" {
  description = "The update_booking Lambda function object."
  value       = aws_lambda_function.update_booking_lambda
}

output "process_booking_request_lambda" {
  description = "The Lambda function object for processing SQS booking requests."
  value       = aws_lambda_function.process_booking_request_lambda
}

output "update_bike_status_on_schedule_lambda" {
  description = "The Lambda function object for updating bike status on schedule."
  value       = aws_lambda_function.update_bike_status_on_schedule_lambda
}

output "export_feedback_to_s3_lambda" {
  description = "The export_feedback_to_s3 Lambda function object."
  value       = aws_lambda_function.export_feedback_to_s3_lambda
}

output "get_bike_feedback_lambda" {
  description = "The Lambda function object for getting bike feedback."
  value       = aws_lambda_function.get_bike_feedback_lambda
}

output "analyze_feedback_sentiment_lambda" {
  description = "The Lambda function object for analyzing feedback sentiment using AWS Comprehend."
  value       = aws_lambda_function.analyze_feedback_sentiment_lambda
}

output "get_frontend_config_lambda" {
  description = "The Lambda function object for getting frontend configuration."
  value       = aws_lambda_function.get_frontend_config_lambda
}
output "get_all_bookings_lambda" {
  description = "The Lambda function object for getting all bookings (Admin)."
  value       = aws_lambda_function.get_all_bookings_lambda
}

output "get_all_bikes_lambda" {
  description = "The Lambda function object for getting all bikes (Admin)."
  value       = aws_lambda_function.get_all_bikes_lambda
}

output "get_all_concerns_lambda" {
  description = "The Lambda function to get all concerns"
  value       = aws_lambda_function.get_all_concerns_lambda
}

output "get_concerns_by_bookingId" {
  description = "The Lambda function to get concerns by booking id"
  value       = aws_lambda_function.get_concerns_by_bookingId_lambda
}

output "resolve_concern_lambda" {
  description = "The Lambda function to resolve a concern"
  value       = aws_lambda_function.resolve_concern_lambda
}

output "raise_concern_lambda" {
  description = "The Lambda function to raise a concern"
  value       = aws_lambda_function.raise_concern_lambda
}
