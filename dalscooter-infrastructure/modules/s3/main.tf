# modules/s3/main.tf
# S3 bucket for feedback CSV export for Looker Studio integration

resource "aws_s3_bucket" "feedback_export" {
  # Use a fixed bucket name for GCP integration compatibility
  bucket = "dalscooter-feedback-export-b00988337"

  tags = {
    Project = "DALScooter"
    Purpose = "Feedback CSV Export for Looker Studio"
  }
}

# Configure bucket to allow public read access for specific objects
resource "aws_s3_bucket_public_access_block" "feedback_export_block" {
  bucket = aws_s3_bucket.feedback_export.id

  # Allow public access configuration but restrict at policy level
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Create bucket policy to allow public read access to feedback and dashboard CSV files
resource "aws_s3_bucket_policy" "allow_public_read" {
  depends_on = [aws_s3_bucket_public_access_block.feedback_export_block]
  bucket     = aws_s3_bucket.feedback_export.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = "*",
      Action    = "s3:GetObject",
      Resource = [
        "${aws_s3_bucket.feedback_export.arn}/feedback_exports/latest_feedback_data.csv",
        "${aws_s3_bucket.feedback_export.arn}/dashboard_*.csv",
        "${aws_s3_bucket.feedback_export.arn}/*analytics_dashboard.csv"
      ]
    }]
  })
}

# Set CORS configuration to allow Looker Studio to access the data
resource "aws_s3_bucket_cors_configuration" "feedback_export_cors" {
  bucket = aws_s3_bucket.feedback_export.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
