# export_dashboard_data_to_s3.py
# 📊 DALSCOOTER ANALYTICS - Raw Data Export Module
# 
# PURPOSE: Export complete DynamoDB table data to S3 CSV files for Looker Studio
# 
# DATA SOURCES:
#   - DALScooterUserAuth → users_data.csv (All user records)
#   - DALScooterBookings → bookings_data.csv (All booking records)  
#   - DALScooterBikes → bikes_data.csv (All bike records)
#   - DALScooterFeedback → feedback_data.csv (All feedback records)
#
# OUTPUT: 4 CSV files with complete table data for Looker Studio

import os
import boto3
import csv
import io
import json
from decimal import Decimal
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import traceback

# 📊 ANALYTICS CONFIGURATION
TABLE_EXPORTS = {
    'BIKES': 'bikes_data.csv',
    'BOOKINGS': 'bookings_data.csv', 
    'USERS': 'users_data.csv',
    'FEEDBACK': 'feedback_data.csv'
}

CSV_HEADERS = []  

class DecimalEncoder(json.JSONEncoder):
    """Handle Decimal types in JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            else:
                return float(obj)
        return json.JSONEncoder.default(self, obj)

def lambda_handler(event, context):
    print(f"START RequestId: {context.aws_request_id}")
    print(f"Incoming event: {json.dumps(event)}")

    # Initialize AWS clients
    dynamodb = boto3.resource('dynamodb')
    s3_client = boto3.client('s3')
    
    # Get environment variables (FIXED: Use actual DynamoDB table names)
    users_table_name = os.environ.get('USERS_TABLE_NAME', 'DALScooterUserAuth')
    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooterBookings')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooterBikes')
    feedback_table_name = os.environ.get('FEEDBACK_TABLE_NAME', 'DALScooterFeedback')
    bucket_name = os.environ.get('FEEDBACK_EXPORT_BUCKET_NAME')
    
    if not all([users_table_name, bookings_table_name, bikes_table_name, feedback_table_name, bucket_name]):
        print("ERROR: One or more required environment variables not set.")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Configuration error: Required environment variables not set.'})
        }
    
    # Initialize DynamoDB tables
    users_table = dynamodb.Table(users_table_name)
    bookings_table = dynamodb.Table(bookings_table_name)
    bikes_table = dynamodb.Table(bikes_table_name)
    feedback_table = dynamodb.Table(feedback_table_name)
    
    try:
        current_timestamp = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
        
        # 1. Export ALL BIKES DATA (Complete table export)
        print("Exporting complete bikes table data...")
        bikes_csv_data = export_table_to_csv(bikes_table, 'bikes')
        upload_csv_to_s3(s3_client, bucket_name, 'bikes_data.csv', bikes_csv_data)
        
        # 2. Export ALL BOOKINGS DATA (Complete table export)  
        print("Exporting complete bookings table data...")
        bookings_csv_data = export_table_to_csv(bookings_table, 'bookings')
        upload_csv_to_s3(s3_client, bucket_name, 'bookings_data.csv', bookings_csv_data)
        
        # 3. Export ALL USERS DATA (Complete table export)
        print("Exporting complete users table data...")
        users_csv_data = export_table_to_csv(users_table, 'users')
        upload_csv_to_s3(s3_client, bucket_name, 'users_data.csv', users_csv_data)
        
        # 4. Export ALL FEEDBACK DATA (Complete table export)
        print("Exporting complete feedback table data...")
        feedback_csv_data = export_table_to_csv(feedback_table, 'feedback')
        upload_csv_to_s3(s3_client, bucket_name, 'feedback_data.csv', feedback_csv_data)
        
        print("All table data exported successfully as CSV files!")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Complete table data exported successfully to S3',
                'files_created': [
                    'bikes_data.csv',
                    'bookings_data.csv', 
                    'users_data.csv',
                    'feedback_data.csv'
                ],
                'bucket': bucket_name,
                'timestamp': current_timestamp
            })
        }
        
    except Exception as e:
        print(f"ERROR: Failed to export dashboard data: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'body': json.dumps({'message': f'Failed to export dashboard data: {str(e)}'})
        }

def export_table_to_csv(table, table_type):
    """Export complete DynamoDB table data to CSV format with actual table columns"""
    try:
        print(f"Scanning {table_type} table for complete data export...")
        
        # Define proper CSV headers for each table type (matching BigQuery schema)
        table_headers = {
            'bikes': ['bikeId', 'createdAt', 'description', 'details', 'lastUpdateDate', 'location', 'model', 'ratePerHour', 'status'],
            'bookings': ['accessCode', 'approvedAt', 'bikeId', 'bikeType', 'bookingReferenceCode', 'createdAt', 'endTime', 'ratePerHour', 'startTime', 'status', 'userId'],
            'users': ['createdAt', 'questions', 'userId', 'userType', 'username'],
            'feedback': ['bikeId', 'comment', 'feedbackId', 'rating', 'sentiment', 'timestamp', 'userId']
        }
        
        # Scan all items from the table
        response = table.scan()
        items = response.get('Items', [])
        
        # Handle pagination for large tables
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        
        # Get predefined headers for this table type
        headers = table_headers.get(table_type, [])
        
        if not items:
            print(f"No data found in {table_type} table - creating CSV with headers only")
            return [headers]  # Return just headers for empty tables
        
        # Extract all unique column names from all items
        all_columns = set()
        for item in items:
            all_columns.update(item.keys())
        
        # Use predefined headers if available, otherwise use discovered columns
        if headers:
            columns = headers
            print(f"Using predefined headers for {table_type}: {columns}")
        else:
            columns = sorted(list(all_columns))
            print(f"Using discovered columns for {table_type}: {columns}")
            
        print(f"Found {len(items)} records for {table_type}")
        
        # Create CSV data starting with headers
        csv_data = [columns]
        
        # Add all records as rows
        for item in items:
            row = []
            for column in columns:
                value = item.get(column, '')
                
                # Handle different DynamoDB data types
                if isinstance(value, Decimal):
                    value = float(value) if value % 1 != 0 else int(value)
                elif isinstance(value, dict):
                    value = json.dumps(value, cls=DecimalEncoder)
                elif isinstance(value, list):
                    value = json.dumps(value, cls=DecimalEncoder)
                elif value is None:
                    value = ''
                else:
                    value = str(value)
                
                row.append(value)
            csv_data.append(row)
        
        print(f"Successfully prepared CSV data for {table_type}: {len(csv_data)-1} records with {len(columns)} columns")
        return csv_data
        
    except Exception as e:
        print(f"ERROR: Failed to export {table_type} table data: {e}")
        print(traceback.format_exc())
        raise

def upload_csv_to_s3(s3_client, bucket_name, file_name, csv_data):
    """Upload CSV data to S3"""
    try:
        # Create CSV content
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer)
        
        for row in csv_data:
            csv_writer.writerow(row)
        
        csv_content = csv_buffer.getvalue()
        
        # Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_name,
            Body=csv_content,
            ContentType='text/csv',
            ContentDisposition=f'attachment; filename="{file_name}"'
        )
        
        print(f"Successfully uploaded {file_name} to S3 bucket {bucket_name}")
        
    except Exception as e:
        print(f"ERROR: Failed to upload {file_name} to S3: {e}")
        raise
