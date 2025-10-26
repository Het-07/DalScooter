# modules/dynamodb/main.tf
# Configures the DynamoDB tables for DALScooter project.

# DynamoDB table for user authentication data
resource "aws_dynamodb_table" "user_auth_table" {
  name           = "DALScooterUserAuth"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "username"

  attribute {
    name = "username"
    type = "S"
  }

  tags = {
    Project = "DALScooter"
  }
}

# NEW: DynamoDB table for Bikes
resource "aws_dynamodb_table" "bikes_table" {
  name           = "DALScooterBikes"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bikeId"

  attribute {
    name = "bikeId"
    type = "S"
  }
  attribute {
    name = "location"
    type = "S"
  }
  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "LocationStatusIndex"
    hash_key        = "location"
    range_key       = "status"
    projection_type = "ALL"
  }

  tags = {
    Project = "DALScooter"
  }
}

# NEW: DynamoDB table for Bookings
resource "aws_dynamodb_table" "bookings_table" {
  name           = "DALScooterBookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bookingReferenceCode"

  attribute {
    name = "bookingReferenceCode"
    type = "S"
  }
  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "bikeId"
    type = "S"
  }
  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "BikeIdStatusIndex"
    hash_key        = "bikeId"
    range_key       = "status"
    projection_type = "ALL"
  }

  tags = {
    Project = "DALScooter"
  }
}

# NEW: DynamoDB table for Feedback
resource "aws_dynamodb_table" "feedback_table" {
  name           = "DALScooterFeedback"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "feedbackId" # Primary key

  attribute {
    name = "feedbackId"
    type = "S"
  }
  attribute {
    name = "bikeId" # Attribute for GSI
    type = "S"
  }
  attribute {
    name = "timestamp" # Attribute for GSI (optional, but good for sorting feedback)
    type = "S"
  }

  global_secondary_index {
    name            = "BikeIdIndex" # NEW GSI
    hash_key        = "bikeId"
    range_key       = "timestamp" # Optional: allows sorting feedback by time for a given bike
    projection_type = "ALL"       # Project all attributes into the index
  }

  tags = {
    Project = "DALScooter"
  }
}

resource "aws_dynamodb_table" "customer_concerns" {
  name         = "CustomerConcerns"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bookingId"

  attribute {
    name = "bookingId"
    type = "S"
  }
}