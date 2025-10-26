# modules/sns_sqs/variables.tf

variable "auth_lambda_role_arn" {
  description = "Auth lambda role ARN"
  type = string
}

variable "send_email_lambda_arn" {
  description = "Send Email lambda ARN"
  type = string
}