# modules/api_gateway/outputs.tf
# Outputs for API Gateway module

output "api_gateway_invoke_url" {
  description = "The invoke URL for the DALScooter API Gateway stage."
  value       = aws_api_gateway_stage.dals_api_stage.invoke_url
}

output "rest_api_id" {
  description = "The ID of the REST API Gateway."
  value       = aws_api_gateway_rest_api.dals_api.id
}