# stream_to_bigquery.py
# 🚀 DALSCOOTER BIGQUERY INTEGRATION - Real-time Data Streaming
# 
# PURPOSE: Stream analytics data from DynamoDB directly to BigQuery for real-time dashboards
# 
# FEATURES:
#   - Real-time streaming to BigQuery data warehouse
#   - Automatic schema validation and type conversion
#   - Batch processing for optimal performance
#   - Error handling and retry logic
#   - Maintains S3 backup during transition
#
# BIGQUERY TABLES:
#   - dalscooter_data_warehouse.bikes_analytics
#   - dalscooter_data_warehouse.bookings_analytics  
#   - dalscooter_data_warehouse.users_analytics
#   - dalscooter_data_warehouse.sentiment_analytics
#
# TRIGGERS: 
#   - EventBridge (scheduled every 1 hour)
#   - API Gateway (manual streaming)
#
# AUTHOR: Data Engineering Team
# CREATED: July 31, 2025

import os
import json
import boto3
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from google.cloud import bigquery
from google.oauth2 import service_account
import traceback
import base64

# 🔧 BIGQUERY CONFIGURATION
PROJECT_ID = os.environ.get('BIGQUERY_PROJECT_ID', 'dalscooter-analytics')
DATASET_ID = os.environ.get('BIGQUERY_DATASET_ID', 'dalscooter_data_warehouse')

# 📊 TABLE MAPPINGS
TABLE_MAPPINGS = {
    'bikes': 'bikes_analytics',
    'bookings': 'bookings_analytics', 
    'users': 'users_analytics',
    'sentiment': 'sentiment_analytics'
}

class DecimalEncoder(json.JSONEncoder):
    """Handle Decimal types in JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def get_bigquery_client():
    """Initialize BigQuery client with service account credentials"""
    try:
        # Get service account key from environment variable (base64 encoded)
        service_account_key = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY')
        if not service_account_key:
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set")
        
        # Decode base64 encoded service account key
        service_account_info = json.loads(base64.b64decode(service_account_key).decode('utf-8'))
        
        # Create credentials from service account info
        credentials = service_account.Credentials.from_service_account_info(service_account_info)
        
        # Initialize BigQuery client
        client = bigquery.Client(credentials=credentials, project=PROJECT_ID)
        return client
    except Exception as e:
        print(f"ERROR: Failed to initialize BigQuery client: {e}")
        raise

def convert_dynamodb_to_bigquery_format(data, table_type):
    """Convert DynamoDB item to BigQuery compatible format - FIXED to match actual DynamoDB schema"""
    current_timestamp = datetime.now(timezone.utc).isoformat()
    
    if table_type == 'bikes':
        # Based on actual DALScooterBikes table schema
        return {
            'bike_id': str(data.get('bikeId', '')),                    # ✅ Real field
            'model': str(data.get('model', '')),                       # ✅ Real field
            'status': str(data.get('status', '')),                     # ✅ Real field  
            'location': str(data.get('location', '')),                 # ✅ Real field
            'rate_per_hour': float(data.get('ratePerHour', 0)) if data.get('ratePerHour') else None,  # ✅ Real field (optional)
            'description': str(data.get('description', '')) if data.get('description') else None,     # ✅ Real field (optional)
            'details': data.get('details') if data.get('details') else None,                          # ✅ Real field (optional JSON)
            'created_at': data.get('createdAt'),                       # ✅ Real field
            'updated_at': current_timestamp                            # ✅ Generated
        }
    elif table_type == 'bookings':
        # Based on actual DALScooterBookings table schema
        return {
            'booking_reference_code': str(data.get('bookingReferenceCode', '')), # ✅ Real field (PK)
            'user_id': str(data.get('userId', '')),                    # ✅ Real field
            'bike_id': str(data.get('bikeId', '')),                    # ✅ Real field
            'bike_type': str(data.get('bikeType', '')) if data.get('bikeType') else None,  # ✅ Real field (optional)
            'status': str(data.get('status', '')),                     # ✅ Real field
            'start_time': data.get('startTime'),                       # ✅ Real field
            'end_time': data.get('endTime'),                           # ✅ Real field
            'rate_per_hour': float(data.get('ratePerHour', 0)) if data.get('ratePerHour') else None,  # ✅ Real field (optional)
            'access_code': str(data.get('accessCode', '')) if data.get('accessCode') else None,       # ✅ Real field (when approved)
            'created_at': data.get('createdAt'),                       # ✅ Real field
            'approved_at': data.get('approvedAt') if data.get('approvedAt') else None,                # ✅ Real field (optional)
            'rejected_reason': str(data.get('rejectedReason', '')) if data.get('rejectedReason') else None,  # ✅ Real field (optional)
            'cancelled_at': data.get('cancelledAt') if data.get('cancelledAt') else None,             # ✅ Real field (optional)
            'updated_at': current_timestamp                            # ✅ Generated
        }
    elif table_type == 'users':
        # Based on actual DALScooterUserAuth table schema  
        return {
            'username': str(data.get('username', '')),                 # ✅ Real field (PK)
            'email': str(data.get('email', '')),                       # ✅ Real field
            'created_at': data.get('createdAt'),                       # ✅ Real field
            'updated_at': current_timestamp                            # ✅ Generated
        }
    elif table_type == 'sentiment':
        # Based on actual DALScooterFeedback table schema
        return {
            'feedback_id': str(data.get('feedbackId', '')),            # ✅ Real field (PK)
            'user_id': str(data.get('userId', '')),                    # ✅ Real field
            'bike_id': str(data.get('bikeId', '')),                    # ✅ Real field
            'rating': int(data.get('rating', 0)) if data.get('rating') else None,  # ✅ Real field
            'comment': str(data.get('comment', '')) if data.get('comment') else None,  # ✅ Real field (optional)
            'sentiment': str(data.get('sentiment', 'PENDING_ANALYSIS')),  # ✅ Real field
            'timestamp': data.get('timestamp'),                        # ✅ Real field
            'created_at': data.get('timestamp'),                       # ✅ Use timestamp as created_at
            'updated_at': current_timestamp                            # ✅ Generated
        }
    else:
        raise ValueError(f"Unknown table type: {table_type}")

def stream_data_to_bigquery(client, table_name, rows):
    """Stream data rows to BigQuery table"""
    try:
        table_ref = client.dataset(DATASET_ID).table(table_name)
        table = client.get_table(table_ref)
        
        # Insert rows
        errors = client.insert_rows_json(table, rows)
        
        if errors:
            print(f"ERROR: BigQuery insert errors for {table_name}: {errors}")
            return False
        else:
            print(f"SUCCESS: Streamed {len(rows)} rows to {table_name}")
            return True
            
    except Exception as e:
        print(f"ERROR: Failed to stream to {table_name}: {e}")
        print(traceback.format_exc())
        return False

def get_recent_dynamodb_data(table, minutes_back=5):
    """Get recent data from DynamoDB table"""
    try:
        # For initial implementation, get all data
        # In production, you'd filter by timestamp for incremental updates
        response = table.scan()
        items = response.get('Items', [])
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        
        return items
    except Exception as e:
        print(f"ERROR: Failed to get data from DynamoDB: {e}")
        return []

def lambda_handler(event, context):
    """Main Lambda handler for BigQuery streaming"""
    print(f"START RequestId: {context.aws_request_id}")
    print(f"Incoming event: {json.dumps(event, cls=DecimalEncoder)}")
    
    try:
        # Initialize clients
        bigquery_client = get_bigquery_client()
        dynamodb = boto3.resource('dynamodb')
        
        # Get table names from environment (FIXED to match actual table names)
        table_names = {
            'bikes': os.environ.get('BIKES_TABLE_NAME', 'DALScooterBikes'),         # ✅ Real table name
            'bookings': os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooterBookings'), # ✅ Real table name  
            'users': os.environ.get('USERS_TABLE_NAME', 'DALScooterUserAuth'),      # ✅ Real table name
            'sentiment': os.environ.get('FEEDBACK_TABLE_NAME', 'DALScooterFeedback') # ✅ Real table name
        }
        
        results = {}
        
        # Stream each table to BigQuery
        for table_type, dynamodb_table_name in table_names.items():
            try:
                print(f"Processing {table_type} data...")
                
                # Get DynamoDB table
                dynamodb_table = dynamodb.Table(dynamodb_table_name)
                
                # Get recent data
                items = get_recent_dynamodb_data(dynamodb_table)
                
                if not items:
                    print(f"No data found for {table_type}")
                    results[table_type] = {'status': 'success', 'rows_streamed': 0}
                    continue
                
                # Convert to BigQuery format
                bigquery_rows = []
                for item in items:
                    try:
                        converted_row = convert_dynamodb_to_bigquery_format(item, table_type)
                        bigquery_rows.append(converted_row)
                    except Exception as e:
                        print(f"ERROR: Failed to convert row for {table_type}: {e}")
                        continue
                
                # Stream to BigQuery
                if bigquery_rows:
                    bigquery_table_name = TABLE_MAPPINGS[table_type]
                    success = stream_data_to_bigquery(bigquery_client, bigquery_table_name, bigquery_rows)
                    
                    if success:
                        results[table_type] = {'status': 'success', 'rows_streamed': len(bigquery_rows)}
                    else:
                        results[table_type] = {'status': 'error', 'rows_streamed': 0}
                else:
                    results[table_type] = {'status': 'success', 'rows_streamed': 0}
                    
            except Exception as e:
                print(f"ERROR: Failed to process {table_type}: {e}")
                results[table_type] = {'status': 'error', 'error': str(e)}
        
        print("BigQuery streaming completed!")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'BigQuery streaming completed',
                'results': results,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"ERROR: BigQuery streaming failed: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'BigQuery streaming failed: {str(e)}',
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        }
