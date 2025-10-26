# modules/lambda/variables.tf
# Variables for Lambda module

variable "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  type        = string
}

variable "user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "franchise_user_group_name" {
  description = "Name of franchise user group"
  type        = string
}

variable "customer_user_group_name" {
  description = "Name of customer user group"
  type        = string
}

variable "user_auth_table_arn" {
  description = "ARN of the user authentication DynamoDB table."
  type        = string
}

variable "user_auth_table_name" {
  description = "Name of the user authentication DynamoDB table."
  type        = string
}

# NEW: Variables for new DynamoDB tables
variable "bikes_table_arn" {
  description = "ARN of the Bikes DynamoDB table."
  type        = string
}

variable "bikes_table_name" {
  description = "Name of the Bikes DynamoDB table."
  type        = string
}

variable "bookings_table_arn" {
  description = "ARN of the Bookings DynamoDB table."
  type        = string
}

variable "bookings_table_name" {
  description = "Name of the Bookings DynamoDB table."
  type        = string
}

variable "feedback_table_arn" {
  description = "ARN of the Feedback DynamoDB table."
  type        = string
}

variable "feedback_table_name" {
  description = "Name of the Feedback DynamoDB table."
  type        = string
}

# booking aprovel QUEUE::
variable "booking_requests_queue_arn" {
  description = "The ARN of the SQS queue for booking requests."
  type        = string
}

variable "booking_requests_queue_url" {
  description = "The URL of the SQS queue for booking requests."
  type        = string
}

variable "feedback_export_bucket_arn" {
  description = "ARN of the S3 bucket for feedback export."
  type        = string
}

variable "feedback_export_bucket_name" {
  description = "Name of the S3 bucket for feedback export."
  type        = string
}

variable "notification_queue_arn" {
  description = "The ARN of the SQS queue for notification."
  type        = string
}

variable "notification_queue_url" {
  description = "The URL of the SQS queue for notification."
  type        = string
}

# BigQuery integration variables - REMOVED
# Using manual BigQuery workflow instead of Lambda streaming

variable "concern_table_arn" {
  description = "ARN of the Concern DynamoDB table."
  type        = string
}

