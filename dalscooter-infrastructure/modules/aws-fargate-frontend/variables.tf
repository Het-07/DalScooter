variable "aws_region" {
  description = "The AWS region to deploy resources in."
  type        = string
  default     = "us-east-1" # Change to your desired region (e.g., "ca-central-1")
}

variable "project_name" {
  description = "A unique name for your project, used as a prefix for resources."
  type        = string
  default     = "dalscooter-frontend" # Customize this
}

variable "environment" {
  description = "The deployment environment (e.g., dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use for public subnets."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"] # Adjust based on your chosen region
}

variable "ecr_repository_name" {
  description = "The name of the ECR repository for your application image."
  type        = string
  default     = "dalscooter-frontend-repo" # Customize this, should match your ECR repo name
}

variable "image_tag" {
  description = "The Docker image tag to deploy (e.g., 'latest', 'v1.0.0')."
  type        = string
  default     = "latest"
}

variable "container_name" {
  description = "The name of the container within the ECS task definition."
  type        = string
  default     = "vite-react-app" # Matches the 'name' in your Dockerfile's container_definitions
}

variable "app_port" {
  description = "The port your Nginx container listens on inside the Docker container."
  type        = number
  default     = 80 # Nginx default port
}

variable "fargate_cpu" {
  description = "The amount of CPU (in CPU units) for the Fargate task."
  type        = string
  default     = "256" # 0.25 vCPU. Options: 256, 512, 1024, 2048, 4096
}

variable "fargate_memory" {
  description = "The amount of memory (in MiB) for the Fargate task."
  type        = string
  default     = "512" # 0.5 GB. Options: 512, 1024, 2048, 3072, 4096, 8192, 16384, 30720
}

variable "desired_task_count" {
  description = "The desired number of running tasks for the ECS service."
  type        = number
  default     = 1
}

# Environment Variables for Runtime Configuration
variable "cognito_user_pool_id" {
  description = "The Cognito User Pool ID to be injected as environment variable."
  type        = string
}

variable "cognito_client_id" {
  description = "The Cognito User Pool Client ID to be injected as environment variable."
  type        = string
}

variable "api_gateway_url" {
  description = "The API Gateway invoke URL to be injected as environment variable."
  type        = string
}