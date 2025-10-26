# modules/sns_sqs/outputs.tf
# Outputs for SNS and SQS resources

output "sqs_queue_arn" {
  description = "ARN of the SQS queue"
  value       = aws_sqs_queue.dalscooter_notification_queue.arn
}

output "sqs_queue_url" {
  description = "URL of the SQS queue"
  value       = aws_sqs_queue.dalscooter_notification_queue.id
}

# booking aprovel QUEUE::
output "booking_requests_queue_arn" {
  description = "The ARN of the SQS queue for booking requests."
  value       = aws_sqs_queue.booking_requests_queue.arn
}

output "booking_requests_queue_url" {
  description = "The URL of the SQS queue for booking requests."
  value       = aws_sqs_queue.booking_requests_queue.url
}