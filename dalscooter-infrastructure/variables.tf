# variables.tf
# Defines variables used across the Terraform configuration.

variable "region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

# BigQuery integration variables - REMOVED
# Using manual BigQuery workflow (refresh_bigquery_data.sh) instead of Lambda streaming
# 
# variable "bigquery_project_id" {
#   description = "Google Cloud Project ID for BigQuery"
#   type        = string
#   default     = "dalscooter-analytics"
# }
# 
# variable "bigquery_dataset_id" {
#   description = "BigQuery dataset ID for DalScooter data warehouse"
#   type        = string
#   default     = "dalscooter_data_warehouse"
# }
# 
# variable "google_service_account_key" {
#   description = "Base64 encoded Google Cloud service account key for BigQuery access"
#   type        = string
#   sensitive   = true
#   default     = ""
# }
