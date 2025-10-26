# modules/eventbridge/outputs.tf
# Outputs for the EventBridge module

output "hourly_feedback_export_rule_arn" {
  description = "ARN of the EventBridge rule that triggers the hourly feedback export"
  value       = aws_cloudwatch_event_rule.hourly_feedback_export.arn
}
