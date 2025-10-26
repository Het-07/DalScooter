resource "aws_ses_email_identity" "sender" {
  email = "dalscooter@outlook.com"
}

#Defining SQS
resource "aws_sqs_queue" "dalscooter_notification_queue" {
  name = "DALScooterNotificationQueue"
}

#Attaching SQS policy. 
resource "aws_sqs_queue_policy" "dalscooter_notification_queue_policy" {
  queue_url = aws_sqs_queue.dalscooter_notification_queue.id
  #Allow Auth Lambda to send message to SQS. 
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          AWS = var.auth_lambda_role_arn
        },
        Action = "sqs:SendMessage",
        Resource = aws_sqs_queue.dalscooter_notification_queue.arn
      }
    ]
  })
}


# booking aprovel QUEUE::
resource "aws_sqs_queue" "booking_requests_queue" {
  name                      = "DALScooterBookingRequestsQueue" # REMOVED .fifo suffix
  delay_seconds             = 0
  max_message_size          = 262144 # 256 KB
  message_retention_seconds = 345600 # 4 days
  receive_wait_time_seconds = 0
  visibility_timeout_seconds = 300 # 5 minutes (should be longer than Lambda's timeout)

  tags = {
    Project = "DALScooter"
  }
}