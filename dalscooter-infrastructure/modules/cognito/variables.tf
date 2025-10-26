# modules/cognito/variables.tf
# Variables for Lambda ARNs

variable "define_auth_challenge_lambda_arn" {
  description = "ARN of the DefineAuthChallenge Lambda"
  type        = string
}

variable "create_auth_challenge_lambda_arn" {
  description = "ARN of the CreateAuthChallenge Lambda"
  type        = string
}

variable "verify_auth_challenge_lambda_arn" {
  description = "ARN of the VerifyAuthChallengeResponse Lambda"
  type        = string
}

variable "post_confirmation_lambda_arn" {
  description = "ARN of the PostConfirmation Lambda"
  type        = string
}

variable "post_authentication_lambda_arn" {
  description = "ARN of the PostAuthentication Lambda"
  type        = string
}