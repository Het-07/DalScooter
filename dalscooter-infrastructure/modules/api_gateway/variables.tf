# modules/api_gateway/variables.tf
# Variables for API Gateway module

variable "user_pool_arn" {
  description = "The ARN of the Cognito User Pool for API Gateway authorizer."
  type        = string
}

# Variables for referencing Lambda functions (passed as objects)
variable "add_bike_lambda" {
  description = "The Lambda function object for add_bike."
  type        = any
}

variable "update_bike_lambda" {
  description = "The Lambda function object for update_bike."
  type        = any
}

variable "get_bike_availability_lambda" {
  description = "The Lambda function object for get_bike_availability."
  type        = any
}

variable "get_booking_bike_details_lambda" {
  description = "The Lambda function object for get_booking_bike_details."
  type        = any
}

variable "get_admin_stats_lambda" {
  description = "The Lambda function object for get_admin_stats."
  type        = any
}

variable "reserve_booking_lambda" {
  description = "The Lambda function object for reserve_booking."
  type        = any
}

variable "get_access_code_lambda" {
  description = "The Lambda function object for get_access_code."
  type        = any
}

variable "submit_feedback_lambda" {
  description = "The Lambda function object for submit_feedback."
  type        = any
}

variable "get_booking_history_lambda" {
  description = "The Lambda function object for get_booking_history."
  type        = any
}

variable "cancel_booking_lambda" {
  description = "The Lambda function object for cancel_booking."
  type        = any
}

variable "update_booking_lambda" {
  description = "The Lambda function object for update_booking."
  type        = any
}

variable "export_feedback_to_s3_lambda" {
  description = "The Lambda function object for export_feedback_to_s3."
  type        = any
}

variable "export_dashboard_data_lambda" {
  description = "The Lambda function object for export_dashboard_data."
  type        = any
}

variable "get_bike_feedback_lambda" {
  description = "The Lambda function object for get_bike_feedback_lambda."
  type        = any
}

variable "get_frontend_config_lambda" {
  description = "The Lambda function object for get_frontend_config."
  type        = any
}
variable "get_all_bookings_lambda" {
  description = "The Lambda function object for get_all_bookings_lambda."
  type        = any
}

variable "get_all_bikes_lambda" {
  description = "The Lambda function for getting all bikes."
  type        = any
}

variable "get_all_concerns_lambda" {
  description = "The Lambda function for getting all concerns."
  type = any
}

variable "get_concerns_by_bookingId" {
  description = "The Lambda function for getting concerns by bookingId."
  type = any
}

variable "resolve_concern_lambda" {
  description = "The Lambda function for resolving a user concern."
  type = any
}

variable "raise_concern_lambda" {
  description = "The Lambda function raising a concern."
  type = any
}