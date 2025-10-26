# modules/eventbridge/variables.tf
# Variables for the EventBridge module

variable "export_feedback_lambda_arn" {
  description = "ARN of the Lambda function that exports feedback to S3"
  type        = string
}

variable "export_feedback_lambda_name" {
  description = "Name of the Lambda function that exports feedback to S3"
  type        = string
}

variable "analyze_feedback_sentiment_lambda_arn" {
  description = "ARN of the Lambda function that analyzes feedback sentiment"
  type        = string
}

variable "analyze_feedback_sentiment_lambda_name" {
  description = "Name of the Lambda function that analyzes feedback sentiment"
  type        = string
}

variable "export_dashboard_data_lambda_arn" {
  description = "ARN of the Lambda function that exports dashboard data to S3"
  type        = string
}

variable "export_dashboard_data_lambda_name" {
  description = "Name of the Lambda function that exports dashboard data to S3"
  type        = string
}

# BigQuery variables removed - using manual workflow
# variable "stream_to_bigquery_lambda_arn" {
#   description = "ARN of the Lambda function that streams data to BigQuery"
#   type        = string
# }

# variable "stream_to_bigquery_lambda_name" {
#   description = "Name of the Lambda function that streams data to BigQuery" 
#   type        = string
# }
