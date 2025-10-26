# get_frontend_config.py
# Returns configuration details for the frontend application
import os
import json
import boto3

def lambda_handler(event, context):
    # Get environment variables
    s3_bucket_name = os.environ.get('FEEDBACK_EXPORT_BUCKET')
    region = os.environ.get('AWS_REGION', 'us-east-1')
    
    # Dashboard CSV URLs for all 4 dashboards in 2x2 format
    s3_csv_latest_url = f"https://{s3_bucket_name}.s3.{region}.amazonaws.com/feedback_exports/latest_feedback_data.csv"
    dashboard_bikes_url = f"https://{s3_bucket_name}.s3.{region}.amazonaws.com/bikes_analytics_dashboard.csv"
    dashboard_bookings_url = f"https://{s3_bucket_name}.s3.{region}.amazonaws.com/bookings_analytics_dashboard.csv"
    dashboard_users_url = f"https://{s3_bucket_name}.s3.{region}.amazonaws.com/users_analytics_dashboard.csv"
    dashboard_sentiment_url = f"https://{s3_bucket_name}.s3.{region}.amazonaws.com/sentiment_analytics_dashboard.csv"
    
    # Get Looker Studio URL from SSM Parameter Store (optional)
    # This allows you to update the URL without deploying new code
    ssm = boto3.client('ssm')
    try:
        looker_param = ssm.get_parameter(Name='/dalscooter/looker-studio-url', WithDecryption=False)
        looker_url = looker_param['Parameter']['Value']
    except Exception as e:
        print(f"Error getting parameter: {e}")
        # Fallback URL if parameter doesn't exist
        looker_url = "https://lookerstudio.google.com/embed/reporting/YOUR_REPORT_ID/page/YOUR_PAGE_ID"
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # For CORS
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps({
            'feedbackExportBucket': s3_bucket_name,
            'feedbackCsvUrl': s3_csv_latest_url,
            'dashboardUrls': {
                'totalBikes': dashboard_bikes_url,
                'totalBookings': dashboard_bookings_url,
                'totalUsers': dashboard_users_url,
                'sentimentAnalysis': dashboard_sentiment_url
            },
            'lookerStudioUrl': looker_url,
            'region': region
        })
    }
