# modules/api_gateway/main.tf
# Configures the API Gateway for the DALScooter application.

# API Gateway REST API
resource "aws_api_gateway_rest_api" "dals_api" {
  name        = "DALScooterAPI"
  description = "API for DALScooter bike and admin operations"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Cognito Authorizer
resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name                             = "CognitoAuthorizer"
  type                             = "COGNITO_USER_POOLS"
  rest_api_id                      = aws_api_gateway_rest_api.dals_api.id
  provider_arns                    = [var.user_pool_arn]
  identity_source                  = "method.request.header.Authorization"
  authorizer_result_ttl_in_seconds = 300 # Cache results for 5 minutes
}

# Root Resource
resource "aws_api_gateway_resource" "root_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_rest_api.dals_api.root_resource_id
  path_part   = "{proxy+}" # Catch-all for basic proxy if desired, or define specific paths
}

# Bikes Resource: /bikes
resource "aws_api_gateway_resource" "bikes_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_rest_api.dals_api.root_resource_id
  path_part   = "bikes"
}

# Bike ID Resource: /bikes/{bike_id}
resource "aws_api_gateway_resource" "bike_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.bikes_resource.id
  path_part   = "{bike_id}"
}

# Bike Availability Resource: /bikes/availability
resource "aws_api_gateway_resource" "bike_availability_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.bikes_resource.id
  path_part   = "availability"
}

# Bookings Resource: /bookings
resource "aws_api_gateway_resource" "bookings_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_rest_api.dals_api.root_resource_id
  path_part   = "bookings"
}

# Booking Reference Code Resource: /bookings/{booking_reference_code}
resource "aws_api_gateway_resource" "booking_ref_code_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.bookings_resource.id
  path_part   = "{booking_reference_code}"
}

# Booking Bike Details Resource: /bookings/{booking_reference_code}/bike-details
resource "aws_api_gateway_resource" "booking_bike_details_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.booking_ref_code_resource.id
  path_part   = "bike-details"
}

# Admin Resource: /admin
resource "aws_api_gateway_resource" "admin_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_rest_api.dals_api.root_resource_id
  path_part   = "admin"
}

# Admin Stats Resource: /admin/stats
resource "aws_api_gateway_resource" "admin_stats_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.admin_resource.id
  path_part   = "stats"
}

# Admin Export Feedback Resource: /admin/export-feedback
resource "aws_api_gateway_resource" "admin_export_feedback_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.admin_resource.id
  path_part   = "export-feedback"
}

# Admin Export Dashboard Resource: /admin/export-dashboard
resource "aws_api_gateway_resource" "admin_export_dashboard_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.admin_resource.id
  path_part   = "export-dashboard"
}

# Config Resource: /config
resource "aws_api_gateway_resource" "config_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_rest_api.dals_api.root_resource_id
  path_part   = "config"
}

# Feedback Resource: /feedback
resource "aws_api_gateway_resource" "feedback_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_rest_api.dals_api.root_resource_id
  path_part   = "feedback"
}

# Feedback Bike ID Resource: /feedback/{bike_id}
resource "aws_api_gateway_resource" "feedback_bike_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.feedback_resource.id
  path_part   = "{bike_id}"
}

# Booking History Resource: /bookings/history
resource "aws_api_gateway_resource" "bookings_history_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.bookings_resource.id
  path_part   = "history"
}

# All Bookings Resource: /bookings/all
resource "aws_api_gateway_resource" "bookings_all_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.bookings_resource.id
  path_part   = "all"
}

# Access Code Resource: /bookings/{booking_reference_code}/access-code
resource "aws_api_gateway_resource" "access_code_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.booking_ref_code_resource.id
  path_part   = "access-code"
}

# All Bikes Resource: /bikes/all
resource "aws_api_gateway_resource" "bikes_all_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.bikes_resource.id # Parent is /bikes
  path_part   = "all"
}

# -----------------------------------------------------------------------------
# CORS OPTIONS METHODS AND INTEGRATIONS
# -----------------------------------------------------------------------------

# CORS for /bikes
resource "aws_api_gateway_method" "options_method_bikes" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bikes_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_bikes" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.bikes_resource.id
  http_method          = aws_api_gateway_method.options_method_bikes.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_bikes" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.bikes_resource.id
  http_method     = aws_api_gateway_method.options_method_bikes.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_bikes" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.bikes_resource.id
  http_method = aws_api_gateway_method.options_method_bikes.http_method
  status_code = aws_api_gateway_method_response.options_response_bikes.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_bikes]
}

# CORS for /bikes/{bike_id}
resource "aws_api_gateway_method" "options_method_bike_id" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bike_id_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_bike_id" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.bike_id_resource.id
  http_method          = aws_api_gateway_method.options_method_bike_id.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_bike_id" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.bike_id_resource.id
  http_method     = aws_api_gateway_method.options_method_bike_id.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_bike_id" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.bike_id_resource.id
  http_method = aws_api_gateway_method.options_method_bike_id.http_method
  status_code = aws_api_gateway_method_response.options_response_bike_id.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_bike_id]
}

# CORS for /bikes/availability
resource "aws_api_gateway_method" "options_method_bike_availability" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bike_availability_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_bike_availability" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.bike_availability_resource.id
  http_method          = aws_api_gateway_method.options_method_bike_availability.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_bike_availability" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.bike_availability_resource.id
  http_method     = aws_api_gateway_method.options_method_bike_availability.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_bike_availability" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.bike_availability_resource.id
  http_method = aws_api_gateway_method.options_method_bike_availability.http_method
  status_code = aws_api_gateway_method_response.options_response_bike_availability.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_bike_availability]
}

# CORS for /bookings
resource "aws_api_gateway_method" "options_method_bookings" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bookings_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_bookings" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.bookings_resource.id
  http_method          = aws_api_gateway_method.options_method_bookings.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_bookings" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.bookings_resource.id
  http_method     = aws_api_gateway_method.options_method_bookings.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_bookings" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.bookings_resource.id
  http_method = aws_api_gateway_method.options_method_bookings.http_method
  status_code = aws_api_gateway_method_response.options_response_bookings.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_bookings]
}

# CORS for /bookings/{booking_reference_code}
resource "aws_api_gateway_method" "options_method_booking_ref_code" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.booking_ref_code_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_booking_ref_code" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.booking_ref_code_resource.id
  http_method          = aws_api_gateway_method.options_method_booking_ref_code.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_booking_ref_code" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.booking_ref_code_resource.id
  http_method     = aws_api_gateway_method.options_method_booking_ref_code.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_booking_ref_code" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.booking_ref_code_resource.id
  http_method = aws_api_gateway_method.options_method_booking_ref_code.http_method
  status_code = aws_api_gateway_method_response.options_response_booking_ref_code.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_booking_ref_code]
}

# CORS for /bookings/{booking_reference_code}/bike-details
resource "aws_api_gateway_method" "options_method_booking_bike_details" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.booking_bike_details_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_booking_bike_details" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.booking_bike_details_resource.id
  http_method          = aws_api_gateway_method.options_method_booking_bike_details.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_booking_bike_details" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.booking_bike_details_resource.id
  http_method     = aws_api_gateway_method.options_method_booking_bike_details.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_booking_bike_details" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.booking_bike_details_resource.id
  http_method = aws_api_gateway_method.options_method_booking_bike_details.http_method
  status_code = aws_api_gateway_method_response.options_response_booking_bike_details.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_booking_bike_details]
}

# CORS for /admin
resource "aws_api_gateway_method" "options_method_admin" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_admin" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.admin_resource.id
  http_method          = aws_api_gateway_method.options_method_admin.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_admin" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.admin_resource.id
  http_method     = aws_api_gateway_method.options_method_admin.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_admin" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.admin_resource.id
  http_method = aws_api_gateway_method.options_method_admin.http_method
  status_code = aws_api_gateway_method_response.options_response_admin.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_admin]
}

# CORS for /admin/stats
resource "aws_api_gateway_method" "options_method_admin_stats" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_stats_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_admin_stats" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.admin_stats_resource.id
  http_method          = aws_api_gateway_method.options_method_admin_stats.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_admin_stats" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.admin_stats_resource.id
  http_method     = aws_api_gateway_method.options_method_admin_stats.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_admin_stats" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.admin_stats_resource.id
  http_method = aws_api_gateway_method.options_method_admin_stats.http_method
  status_code = aws_api_gateway_method_response.options_response_admin_stats.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_admin_stats]
}

# CORS for /admin/export-feedback
resource "aws_api_gateway_method" "options_method_admin_export_feedback" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_export_feedback_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_admin_export_feedback" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.admin_export_feedback_resource.id
  http_method          = aws_api_gateway_method.options_method_admin_export_feedback.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_admin_export_feedback" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.admin_export_feedback_resource.id
  http_method     = aws_api_gateway_method.options_method_admin_export_feedback.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_admin_export_feedback" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.admin_export_feedback_resource.id
  http_method = aws_api_gateway_method.options_method_admin_export_feedback.http_method
  status_code = aws_api_gateway_method_response.options_response_admin_export_feedback.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_admin_export_feedback]
}

# CORS for /feedback
resource "aws_api_gateway_method" "options_method_feedback" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.feedback_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_feedback" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.feedback_resource.id
  http_method          = aws_api_gateway_method.options_method_feedback.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_feedback" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.feedback_resource.id
  http_method     = aws_api_gateway_method.options_method_feedback.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_feedback" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.feedback_resource.id
  http_method = aws_api_gateway_method.options_method_feedback.http_method
  status_code = aws_api_gateway_method_response.options_response_feedback.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_feedback]
}

# CORS for /feedback/{bike_id}
resource "aws_api_gateway_method" "options_method_feedback_bike_id" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.feedback_bike_id_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_feedback_bike_id" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.feedback_bike_id_resource.id
  http_method          = aws_api_gateway_method.options_method_feedback_bike_id.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_feedback_bike_id" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.feedback_bike_id_resource.id
  http_method     = aws_api_gateway_method.options_method_feedback_bike_id.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_feedback_bike_id" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.feedback_bike_id_resource.id
  http_method = aws_api_gateway_method.options_method_feedback_bike_id.http_method
  status_code = aws_api_gateway_method_response.options_response_feedback_bike_id.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_feedback_bike_id]
}

# CORS for /bookings/history
resource "aws_api_gateway_method" "options_method_bookings_history" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bookings_history_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_bookings_history" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.bookings_history_resource.id
  http_method          = aws_api_gateway_method.options_method_bookings_history.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_bookings_history" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.bookings_history_resource.id
  http_method     = aws_api_gateway_method.options_method_bookings_history.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_bookings_history" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.bookings_history_resource.id
  http_method = aws_api_gateway_method.options_method_bookings_history.http_method
  status_code = aws_api_gateway_method_response.options_response_bookings_history.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_bookings_history]
}

# CORS for /bookings/all
resource "aws_api_gateway_method" "options_method_bookings_all" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bookings_all_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_bookings_all" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.bookings_all_resource.id
  http_method          = aws_api_gateway_method.options_method_bookings_all.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_bookings_all" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.bookings_all_resource.id
  http_method     = aws_api_gateway_method.options_method_bookings_all.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_bookings_all" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.bookings_all_resource.id
  http_method = aws_api_gateway_method.options_method_bookings_all.http_method
  status_code = aws_api_gateway_method_response.options_response_bookings_all.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_bookings_all]
}

# CORS for /bookings/{booking_reference_code}/access-code
resource "aws_api_gateway_method" "options_method_access_code" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.access_code_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_access_code" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.access_code_resource.id
  http_method          = aws_api_gateway_method.options_method_access_code.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_access_code" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.access_code_resource.id
  http_method     = aws_api_gateway_method.options_method_access_code.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_access_code" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.access_code_resource.id
  http_method = aws_api_gateway_method.options_method_access_code.http_method
  status_code = aws_api_gateway_method_response.options_response_access_code.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_access_code]
}

# CORS for /bikes/all
resource "aws_api_gateway_method" "options_method_bikes_all" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bikes_all_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "options_integration_bikes_all" {
  rest_api_id          = aws_api_gateway_rest_api.dals_api.id
  resource_id          = aws_api_gateway_resource.bikes_all_resource.id
  http_method          = aws_api_gateway_method.options_method_bikes_all.http_method
  type                 = "MOCK"
  request_templates    = { "application/json" = "{ \"statusCode\": 200 }" }
  passthrough_behavior = "WHEN_NO_MATCH"
}
resource "aws_api_gateway_method_response" "options_response_bikes_all" {
  rest_api_id     = aws_api_gateway_rest_api.dals_api.id
  resource_id     = aws_api_gateway_resource.bikes_all_resource.id
  http_method     = aws_api_gateway_method.options_method_bikes_all.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}
resource "aws_api_gateway_integration_response" "options_integration_response_bikes_all" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.bikes_all_resource.id
  http_method = aws_api_gateway_method.options_method_bikes_all.http_method
  status_code = aws_api_gateway_method_response.options_response_bikes_all.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_integration_bikes_all]
}

# -----------------------------------------------------------------------------
# EXISTING METHODS AND INTEGRATIONS (MODIFIED FOR CORS COMPATIBILITY)
# -----------------------------------------------------------------------------

# Method: POST /bikes (add_bike)
resource "aws_api_gateway_method" "add_bike_post_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bikes_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id

  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
}

resource "aws_api_gateway_integration" "add_bike_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.bikes_resource.id
  http_method             = aws_api_gateway_method.add_bike_post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.add_bike_lambda.invoke_arn
}

resource "aws_lambda_permission" "add_bike_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeAddBike"
  action        = "lambda:InvokeFunction"
  function_name = var.add_bike_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/POST/bikes"
}

# Method: PUT /bikes/{bike_id} (update_bike)
resource "aws_api_gateway_method" "update_bike_put_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bike_id_resource.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id

  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
  request_parameters = {
    "method.request.path.bike_id" = true
  }
}

resource "aws_api_gateway_integration" "update_bike_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.bike_id_resource.id
  http_method             = aws_api_gateway_method.update_bike_put_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.update_bike_lambda.invoke_arn
  request_parameters = {
    "integration.request.path.bike_id" = "method.request.path.bike_id"
  }
}

resource "aws_lambda_permission" "update_bike_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeUpdateBike"
  action        = "lambda:InvokeFunction"
  function_name = var.update_bike_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/PUT/bikes/*"
}

# Method: GET /bikes/availability (get_bike_availability)
resource "aws_api_gateway_method" "get_bike_availability_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bike_availability_resource.id
  http_method   = "GET"
  authorization = "NONE"
  # authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id # Not needed for NONE authorization
  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
}

resource "aws_api_gateway_integration" "get_bike_availability_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.bike_availability_resource.id
  http_method             = aws_api_gateway_method.get_bike_availability_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_bike_availability_lambda.invoke_arn
}

resource "aws_lambda_permission" "get_bike_availability_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetBikeAvailability"
  action        = "lambda:InvokeFunction"
  function_name = var.get_bike_availability_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/bikes/availability"
}

# Method: GET /bookings/{booking_reference_code}/bike-details (get_booking_bike_details)
resource "aws_api_gateway_method" "get_booking_bike_details_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.booking_bike_details_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id

  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
  request_parameters = {
    "method.request.path.booking_reference_code" = true
  }
}

resource "aws_api_gateway_integration" "get_booking_bike_details_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.booking_bike_details_resource.id
  http_method             = aws_api_gateway_method.get_booking_bike_details_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_booking_bike_details_lambda.invoke_arn

  request_parameters = {
    "integration.request.path.booking_reference_code" = "method.request.path.booking_reference_code"
  }
}

resource "aws_lambda_permission" "get_booking_bike_details_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetBookingBikeDetails"
  action        = "lambda:InvokeFunction"
  function_name = var.get_booking_bike_details_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/bookings/*/bike-details"
}


# Method: GET /admin/stats (get_admin_stats)
resource "aws_api_gateway_method" "get_admin_stats_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_stats_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id

  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
}

resource "aws_api_gateway_integration" "get_admin_stats_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.admin_stats_resource.id
  http_method             = aws_api_gateway_method.get_admin_stats_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_admin_stats_lambda.invoke_arn
}

resource "aws_lambda_permission" "get_admin_stats_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetAdminStats"
  action        = "lambda:InvokeFunction"
  function_name = var.get_admin_stats_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/admin/stats"
}

# API Gateway Stage
resource "aws_api_gateway_stage" "dals_api_stage" {
  deployment_id = aws_api_gateway_deployment.dals_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  stage_name    = "prod"
}

# Feedback Resource: /feedback
# resource "aws_api_gateway_resource" "feedback_resource" { ... } # Defined above

# Booking History Resource: /bookings/history
# resource "aws_api_gateway_resource" "bookings_history_resource" { ... } # Defined above


# METHODS AND INTEGRATIONS FOR BOOKING/RESERVATION MODULE

# Method: POST /bookings (reserve_booking)
resource "aws_api_gateway_method" "reserve_booking_post_method" {
  rest_api_id      = aws_api_gateway_rest_api.dals_api.id
  resource_id      = aws_api_gateway_resource.bookings_resource.id
  http_method      = "POST"
  authorization    = "COGNITO_USER_POOLS"
  authorizer_id    = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
}

resource "aws_api_gateway_integration" "reserve_booking_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.bookings_resource.id
  http_method             = aws_api_gateway_method.reserve_booking_post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.reserve_booking_lambda.invoke_arn
}

resource "aws_lambda_permission" "reserve_booking_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeReserveBooking"
  action        = "lambda:InvokeFunction"
  function_name = var.reserve_booking_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/POST/bookings"
}

resource "aws_api_gateway_method" "get_access_code_get_method" {
  rest_api_id      = aws_api_gateway_rest_api.dals_api.id
  resource_id      = aws_api_gateway_resource.access_code_resource.id
  http_method      = "GET"
  authorization    = "COGNITO_USER_POOLS"
  authorizer_id    = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
  request_parameters = {
    "method.request.path.booking_reference_code" = true
  }
}

resource "aws_api_gateway_integration" "get_access_code_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.access_code_resource.id
  http_method             = aws_api_gateway_method.get_access_code_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_access_code_lambda.invoke_arn

  request_parameters = {
    "integration.request.path.booking_reference_code" = "method.request.path.booking_reference_code"
  }
}

resource "aws_lambda_permission" "get_access_code_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetAccessCode"
  action        = "lambda:InvokeFunction"
  function_name = var.get_access_code_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/bookings/*/access-code"
}


# Method: POST /feedback (submit_feedback)
resource "aws_api_gateway_method" "submit_feedback_post_method" {
  rest_api_id      = aws_api_gateway_rest_api.dals_api.id
  resource_id      = aws_api_gateway_resource.feedback_resource.id
  http_method      = "POST"
  authorization    = "COGNITO_USER_POOLS"
  authorizer_id    = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
}

resource "aws_api_gateway_integration" "submit_feedback_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.feedback_resource.id
  http_method             = aws_api_gateway_method.submit_feedback_post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.submit_feedback_lambda.invoke_arn
}

resource "aws_lambda_permission" "submit_feedback_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeSubmitFeedback"
  action        = "lambda:InvokeFunction"
  function_name = var.submit_feedback_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/POST/feedback"
}

resource "aws_api_gateway_method" "get_bike_feedback_get_method" {
  rest_api_id      = aws_api_gateway_rest_api.dals_api.id
  resource_id      = aws_api_gateway_resource.feedback_bike_id_resource.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
  request_parameters = {
    "method.request.path.bike_id" = true
  }
}

resource "aws_api_gateway_integration" "get_bike_feedback_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.feedback_bike_id_resource.id
  http_method             = aws_api_gateway_method.get_bike_feedback_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_bike_feedback_lambda.invoke_arn
  request_parameters = {
    "integration.request.path.bike_id" = "method.request.path.bike_id"
  }
}

resource "aws_lambda_permission" "allow_api_gateway_to_invoke_get_bike_feedback" {
  statement_id  = "AllowExecutionFromAPIGatewayGetBikeFeedback"
  action        = "lambda:InvokeFunction"
  function_name = var.get_bike_feedback_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/feedback/*"
}

# Method: GET /bookings/history (get_booking_history)
resource "aws_api_gateway_method" "get_booking_history_get_method" {
  rest_api_id      = aws_api_gateway_rest_api.dals_api.id
  resource_id      = aws_api_gateway_resource.bookings_history_resource.id
  http_method      = "GET"
  authorization    = "COGNITO_USER_POOLS"
  authorizer_id    = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
}

resource "aws_api_gateway_integration" "get_booking_history_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.bookings_history_resource.id
  http_method             = aws_api_gateway_method.get_booking_history_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_booking_history_lambda.invoke_arn
}

resource "aws_lambda_permission" "get_booking_history_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetBookingHistory"
  action        = "lambda:InvokeFunction"
  function_name = var.get_booking_history_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/bookings/history"
}

# Method: DELETE /bookings/{booking_id} (cancel_booking)
resource "aws_api_gateway_method" "cancel_booking_delete_method" {
  rest_api_id      = aws_api_gateway_rest_api.dals_api.id
  resource_id      = aws_api_gateway_resource.booking_ref_code_resource.id
  http_method      = "DELETE"
  authorization    = "COGNITO_USER_POOLS"
  authorizer_id    = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
  request_parameters = {
    "method.request.path.booking_id" = true
  }
}

resource "aws_api_gateway_integration" "cancel_booking_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.booking_ref_code_resource.id
  http_method             = aws_api_gateway_method.cancel_booking_delete_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.cancel_booking_lambda.invoke_arn

  request_parameters = {
    "integration.request.path.booking_id" = "method.request.path.booking_id"
  }
}

resource "aws_lambda_permission" "cancel_booking_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeCancelBooking"
  action        = "lambda:InvokeFunction"
  function_name = var.cancel_booking_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/DELETE/bookings/*"
}

# Method: PUT /bookings/{booking_id} (update_booking)
resource "aws_api_gateway_method" "update_booking_put_method" {
  rest_api_id      = aws_api_gateway_rest_api.dals_api.id
  resource_id      = aws_api_gateway_resource.booking_ref_code_resource.id
  http_method      = "PUT"
  authorization    = "COGNITO_USER_POOLS"
  authorizer_id    = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
  request_parameters = {
    "method.request.path.booking_id" = true
  }
}

resource "aws_api_gateway_integration" "update_booking_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.booking_ref_code_resource.id
  http_method             = aws_api_gateway_method.update_booking_put_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.update_booking_lambda.invoke_arn

  request_parameters = {
    "integration.request.path.booking_id" = "method.request.path.booking_id"
  }
}

resource "aws_lambda_permission" "update_booking_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeUpdateBooking"
  action        = "lambda:InvokeFunction"
  function_name = var.update_booking_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/PUT/bookings/*"
}


# Method: POST /admin/export-feedback (export_feedback_to_s3)
resource "aws_api_gateway_method" "export_feedback_to_s3_post_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_export_feedback_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id

  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
}

resource "aws_api_gateway_integration" "export_feedback_to_s3_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.admin_export_feedback_resource.id
  http_method             = aws_api_gateway_method.export_feedback_to_s3_post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.export_feedback_to_s3_lambda.invoke_arn
}

resource "aws_lambda_permission" "export_feedback_to_s3_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeExportFeedbackToS3"
  action        = "lambda:InvokeFunction"
  function_name = var.export_feedback_to_s3_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/POST/admin/export-feedback"
}

# Method: GET /bookings/all (get_all_bookings)
resource "aws_api_gateway_method" "get_all_bookings_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.bookings_all_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id

  api_key_required = false # Added/Ensured for CORS
  request_models   = {}    # Added/Ensured for CORS
}

resource "aws_api_gateway_integration" "get_all_bookings_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.bookings_all_resource.id
  http_method             = aws_api_gateway_method.get_all_bookings_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_all_bookings_lambda.invoke_arn
}

resource "aws_lambda_permission" "allow_api_gateway_to_invoke_get_all_bookings" {
  statement_id  = "AllowExecutionFromAPIGatewayGetAllBookings"
  action        = "lambda:InvokeFunction"
  function_name = var.get_all_bookings_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/bookings/all"
}

# Method: GET /bikes/all (get_all_bikes)
resource "aws_api_gateway_method" "get_all_bikes_get_method" {
  rest_api_id      = aws_api_gateway_rest_api.dals_api.id
  resource_id      = aws_api_gateway_resource.bikes_all_resource.id
  http_method      = "GET"
  authorization    = "COGNITO_USER_POOLS" # Admins need to be authenticated
  authorizer_id    = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false
  request_models   = {}
}

resource "aws_api_gateway_integration" "get_all_bikes_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.bikes_all_resource.id
  http_method             = aws_api_gateway_method.get_all_bikes_get_method.http_method
  integration_http_method = "POST" # Lambda proxy integration uses POST to Lambda
  type                    = "AWS_PROXY"
  uri                     = var.get_all_bikes_lambda.invoke_arn # Link to the new Lambda
}

resource "aws_lambda_permission" "get_all_bikes_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetAllBikes"
  action        = "lambda:InvokeFunction"
  function_name = var.get_all_bikes_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/bikes/all"
}

# Method: POST /admin/export-dashboard (export_dashboard_data)
resource "aws_api_gateway_method" "export_dashboard_data_post_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_export_dashboard_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "export_dashboard_data_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.admin_export_dashboard_resource.id
  http_method             = aws_api_gateway_method.export_dashboard_data_post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.export_dashboard_data_lambda.invoke_arn
}

resource "aws_lambda_permission" "export_dashboard_data_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeExportDashboardData"
  action        = "lambda:InvokeFunction"
  function_name = var.export_dashboard_data_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/*"
}

# API Gateway Deployment (UPDATED depends_on and triggers)
resource "aws_api_gateway_deployment" "dals_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.add_bike_integration,
    aws_api_gateway_integration.update_bike_integration,
    aws_api_gateway_integration.get_bike_availability_integration,
    aws_api_gateway_integration.get_booking_bike_details_integration,
    aws_api_gateway_integration.get_admin_stats_integration,
    aws_api_gateway_integration.reserve_booking_integration,
    aws_api_gateway_integration.get_access_code_integration,
    aws_api_gateway_integration.submit_feedback_integration,
    aws_api_gateway_integration.get_booking_history_integration,
    aws_api_gateway_integration.cancel_booking_integration,
    aws_api_gateway_integration.update_booking_integration,
    aws_api_gateway_integration.export_feedback_to_s3_integration,
    aws_api_gateway_integration.export_dashboard_data_integration,
    aws_api_gateway_integration.get_bike_feedback_integration, # NEW
    aws_api_gateway_integration.get_bike_feedback_integration,
    aws_api_gateway_integration.get_all_bookings_integration,
    aws_api_gateway_integration.get_all_bikes_integration,
    aws_api_gateway_integration.raise_concern_integration,
    aws_api_gateway_integration.get_all_concerns_integration,
    aws_api_gateway_integration.resolve_concern_integration,
    aws_api_gateway_integration.get_concerns_by_bookingId_integration,

    # CORS integrations added below
    aws_api_gateway_integration.options_integration_bikes,
    aws_api_gateway_integration.options_integration_bike_id,
    aws_api_gateway_integration.options_integration_bike_availability,
    aws_api_gateway_integration.options_integration_bookings,
    aws_api_gateway_integration.options_integration_booking_ref_code,
    aws_api_gateway_integration.options_integration_booking_bike_details,
    aws_api_gateway_integration.options_integration_admin,
    aws_api_gateway_integration.options_integration_admin_stats,
    aws_api_gateway_integration.options_integration_admin_export_feedback,
    aws_api_gateway_integration.options_integration_feedback,
    aws_api_gateway_integration.options_integration_feedback_bike_id,
    aws_api_gateway_integration.options_integration_bookings_history,
    aws_api_gateway_integration.options_integration_bookings_all,
    aws_api_gateway_integration.options_integration_access_code,
    aws_api_gateway_integration.options_integration_bikes_all,
    aws_api_gateway_integration.admin_concerns_options_integration,
    aws_api_gateway_integration.concern_options_integration,
    aws_api_gateway_integration.resolve_concern_options_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  triggers = {
    # This will redeploy API Gateway on any change to methods/integrations
    redeployment = sha1(jsonencode([
      aws_api_gateway_method.add_bike_post_method,
      aws_api_gateway_integration.add_bike_integration,
      aws_api_gateway_method.update_bike_put_method,
      aws_api_gateway_integration.update_bike_integration,
      aws_api_gateway_method.get_bike_availability_get_method,
      aws_api_gateway_integration.get_bike_availability_integration,
      aws_api_gateway_method.get_booking_bike_details_get_method,
      aws_api_gateway_integration.get_booking_bike_details_integration,
      aws_api_gateway_method.get_admin_stats_get_method,
      aws_api_gateway_integration.get_admin_stats_integration,
      aws_api_gateway_method.reserve_booking_post_method,
      aws_api_gateway_integration.reserve_booking_integration,
      aws_api_gateway_method.get_access_code_get_method,
      aws_api_gateway_integration.get_access_code_integration,
      aws_api_gateway_method.submit_feedback_post_method,
      aws_api_gateway_integration.submit_feedback_integration,
      aws_api_gateway_method.get_booking_history_get_method,
      aws_api_gateway_integration.get_booking_history_integration,
      aws_api_gateway_method.cancel_booking_delete_method,
      aws_api_gateway_integration.cancel_booking_integration,
      aws_api_gateway_method.update_booking_put_method,
      aws_api_gateway_integration.update_booking_integration,
      aws_api_gateway_method.export_feedback_to_s3_post_method,
      aws_api_gateway_integration.export_feedback_to_s3_integration,
      aws_api_gateway_method.export_dashboard_data_post_method,
      aws_api_gateway_integration.export_dashboard_data_integration,
      aws_api_gateway_method.get_bike_feedback_get_method,
      aws_api_gateway_integration.get_bike_feedback_integration,
      aws_api_gateway_method.get_all_bookings_get_method,
      aws_api_gateway_integration.get_all_bookings_integration,
      aws_api_gateway_method.get_all_bikes_get_method,
      aws_api_gateway_integration.get_all_bikes_integration,
      aws_api_gateway_integration.raise_concern_integration,
      aws_api_gateway_method.raise_concern_post_method,
      aws_api_gateway_integration.get_all_concerns_integration,
      aws_api_gateway_method.get_all_concerns_get_method,
      aws_api_gateway_integration.resolve_concern_integration,
      aws_api_gateway_method.resolve_concern_post_method,
      aws_api_gateway_integration.get_concerns_by_bookingId_integration,
      aws_api_gateway_method.get_concerns_by_bookingId_get_method,

      # Include OPTIONS methods in triggers to force redeployment when CORS changes
      aws_api_gateway_method.options_method_bikes,
      aws_api_gateway_method.options_method_bike_id,
      aws_api_gateway_method.options_method_bike_availability,
      aws_api_gateway_method.options_method_bookings,
      aws_api_gateway_method.options_method_booking_ref_code,
      aws_api_gateway_method.options_method_booking_bike_details,
      aws_api_gateway_method.options_method_admin,
      aws_api_gateway_method.options_method_admin_stats,
      aws_api_gateway_method.options_method_admin_export_feedback,
      aws_api_gateway_method.options_method_feedback,
      aws_api_gateway_method.options_method_feedback_bike_id,
      aws_api_gateway_method.options_method_bookings_history,
      aws_api_gateway_method.options_method_bookings_all,
      aws_api_gateway_method.options_method_access_code,
      aws_api_gateway_method.options_method_bikes_all,
      aws_api_gateway_method.concern_options_method,
      aws_api_gateway_method.admin_concerns_options_method,
      aws_api_gateway_method.resolve_concern_options_method
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# /concern resource
resource "aws_api_gateway_resource" "concern_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_rest_api.dals_api.root_resource_id
  path_part   = "concern"
}

resource "aws_api_gateway_method" "raise_concern_post_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.concern_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false
  request_models = {}
}

resource "aws_api_gateway_integration" "raise_concern_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.concern_resource.id
  http_method             = aws_api_gateway_method.raise_concern_post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.raise_concern_lambda.invoke_arn
}

resource "aws_lambda_permission" "raise_concern_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeRaiseConcern"
  action        = "lambda:InvokeFunction"
  function_name = var.raise_concern_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/POST/concern"
}

# /admin/concerns resource
resource "aws_api_gateway_resource" "admin_concern_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.admin_resource.id
  path_part   = "concerns"
}

resource "aws_api_gateway_method" "get_all_concerns_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_concern_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false
  request_models = {}
}

resource "aws_api_gateway_integration" "get_all_concerns_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.admin_concern_resource.id
  http_method             = aws_api_gateway_method.get_all_concerns_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_all_concerns_lambda.invoke_arn
}

resource "aws_lambda_permission" "get_all_concerns_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetAllConcerns"
  action        = "lambda:InvokeFunction"
  function_name = var.get_all_concerns_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/admin/concerns"
}

# /concern/bookingId?{$bookingId}
resource "aws_api_gateway_method" "get_concerns_by_bookingId_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.concern_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false
  request_models = {}
}

resource "aws_api_gateway_integration" "get_concerns_by_bookingId_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.concern_resource.id
  http_method             = aws_api_gateway_method.get_concerns_by_bookingId_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_concerns_by_bookingId.invoke_arn
}

resource "aws_lambda_permission" "get_concerns_by_bookingId_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetConcernsByBookingId"
  action        = "lambda:InvokeFunction"
  function_name = var.get_concerns_by_bookingId.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/GET/concern"
}

# /admin/concerns/resolve resource
resource "aws_api_gateway_resource" "admin_concern_resolve_resource" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  parent_id   = aws_api_gateway_resource.admin_concern_resource.id
  path_part   = "resolve"
}

resource "aws_api_gateway_method" "resolve_concern_post_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_concern_resolve_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
  api_key_required = false
  request_models = {}
}

resource "aws_api_gateway_integration" "resolve_concern_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.admin_concern_resolve_resource.id
  http_method             = aws_api_gateway_method.resolve_concern_post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.resolve_concern_lambda.invoke_arn
}

resource "aws_lambda_permission" "resolve_concern_api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvokeResolveConcern"
  action        = "lambda:InvokeFunction"
  function_name = var.resolve_concern_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/POST/admin/concerns/resolve"
}


# OPTIONS Config for Concer Lambdas

resource "aws_api_gateway_method" "concern_options_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.concern_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "concern_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.concern_resource.id
  http_method = aws_api_gateway_method.concern_options_method.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "concern_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.concern_resource.id
  http_method = aws_api_gateway_method.concern_options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'POST,GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
   depends_on = [
    aws_api_gateway_integration.concern_options_integration
  ]
}

resource "aws_api_gateway_method_response" "concern_options_method_response" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.concern_resource.id
  http_method = aws_api_gateway_method.concern_options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method" "admin_concerns_options_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_concern_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "admin_concerns_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.admin_concern_resource.id
  http_method = aws_api_gateway_method.admin_concerns_options_method.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "admin_concerns_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.admin_concern_resource.id
  http_method = aws_api_gateway_method.admin_concerns_options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [
    aws_api_gateway_integration.admin_concerns_options_integration
  ]
}

resource "aws_api_gateway_method_response" "admin_concerns_options_method_response" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.admin_concern_resource.id
  http_method = aws_api_gateway_method.admin_concerns_options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method" "resolve_concern_options_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.admin_concern_resolve_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "resolve_concern_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.admin_concern_resolve_resource.id
  http_method = aws_api_gateway_method.resolve_concern_options_method.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "resolve_concern_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.admin_concern_resolve_resource.id
  http_method = aws_api_gateway_method.resolve_concern_options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [
    aws_api_gateway_integration.resolve_concern_options_integration
  ]
}

resource "aws_api_gateway_method_response" "resolve_concern_options_method_response" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.admin_concern_resolve_resource.id
  http_method = aws_api_gateway_method.resolve_concern_options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}


# API Gateway Stage (EXISTING)
# resource "aws_api_gateway_stage" "dals_api_stage" { ... }

# GET Method for Config Resource
resource "aws_api_gateway_method" "config_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.config_resource.id
  http_method   = "GET"
  authorization = "NONE" # Public access for frontend configuration
}

# GET Method Integration for Config Resource
resource "aws_api_gateway_integration" "config_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dals_api.id
  resource_id             = aws_api_gateway_resource.config_resource.id
  http_method             = aws_api_gateway_method.config_get_method.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.get_frontend_config_lambda.invoke_arn
}

# CORS for Config Resource
resource "aws_api_gateway_method" "config_options_method" {
  rest_api_id   = aws_api_gateway_rest_api.dals_api.id
  resource_id   = aws_api_gateway_resource.config_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "config_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.config_resource.id
  http_method = aws_api_gateway_method.config_options_method.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "config_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.config_resource.id
  http_method = aws_api_gateway_method.config_options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.config_options_integration]
}

resource "aws_api_gateway_method_response" "config_options_method_response" {
  rest_api_id = aws_api_gateway_rest_api.dals_api.id
  resource_id = aws_api_gateway_resource.config_resource.id
  http_method = aws_api_gateway_method.config_options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  depends_on = [aws_api_gateway_method.config_options_method]
}

# Lambda permission for config GET endpoint
resource "aws_lambda_permission" "api_gateway_get_frontend_config" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.get_frontend_config_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dals_api.execution_arn}/*/${aws_api_gateway_method.config_get_method.http_method}${aws_api_gateway_resource.config_resource.path}"
}
