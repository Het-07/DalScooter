# modules/s3/outputs.tf
# Outputs for S3 feedback export bucket

output "feedback_export_bucket_name" {
  description = "Name of the S3 bucket for feedback export."
  value       = aws_s3_bucket.feedback_export.bucket
}

output "feedback_export_bucket_arn" {
  description = "ARN of the S3 bucket for feedback export."
  value       = aws_s3_bucket.feedback_export.arn
}
