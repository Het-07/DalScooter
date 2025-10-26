# modules/eventbridge/main.tf
# Configures EventBridge rules and targets for scheduled Lambda functions and other automated tasks

# Feedback export to S3 for Looker Studio integration every 5 minutes
resource "aws_cloudwatch_event_rule" "hourly_feedback_export" {
  name                = "feedback-export-hourly"
  description         = "Trigger feedback export Lambda every 5 minutes for Looker Studio dashboard updates"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "feedback_export_target" {
  rule      = aws_cloudwatch_event_rule.hourly_feedback_export.name
  target_id = "ExportFeedbackToS3"
  arn       = var.export_feedback_lambda_arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_export_feedback" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = var.export_feedback_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.hourly_feedback_export.arn
}

# Feedback sentiment analysis using AWS Comprehend every 5 minutes
resource "aws_cloudwatch_event_rule" "hourly_feedback_sentiment_analysis" {
  name                = "feedback-sentiment-analysis-hourly"
  description         = "Trigger sentiment analysis Lambda every 5 minutes for feedback data"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "feedback_sentiment_analysis_target" {
  rule      = aws_cloudwatch_event_rule.hourly_feedback_sentiment_analysis.name
  target_id = "AnalyzeFeedbackSentiment"
  arn       = var.analyze_feedback_sentiment_lambda_arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_analyze_sentiment" {
  statement_id  = "AllowExecutionFromCloudWatchForSentiment"
  action        = "lambda:InvokeFunction"
  function_name = var.analyze_feedback_sentiment_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.hourly_feedback_sentiment_analysis.arn
}

# Dashboard data export to S3 for BI tools every 5 minutes
resource "aws_cloudwatch_event_rule" "hourly_dashboard_export" {
  name                = "dashboard-export-hourly"
  description         = "Trigger dashboard export Lambda every 5 minutes for BI tool updates"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "dashboard_export_target" {
  rule      = aws_cloudwatch_event_rule.hourly_dashboard_export.name
  target_id = "ExportDashboardDataToS3"
  arn       = var.export_dashboard_data_lambda_arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_export_dashboard" {
  statement_id  = "AllowExecutionFromCloudWatchForDashboard"
  action        = "lambda:InvokeFunction"
  function_name = var.export_dashboard_data_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.hourly_dashboard_export.arn
}

# BigQuery real-time streaming - REMOVED
# Using manual BigQuery workflow instead (refresh_bigquery_data.sh)
