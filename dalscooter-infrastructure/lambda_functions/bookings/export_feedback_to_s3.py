# export_feedback_to_s3.py
# Lambda function to export all feedback from DynamoDB to S3 as a CSV file
# Trigger: API Gateway (manual export) or EventBridge (scheduled export)
# Author: DalScooter Team
# Date: 2025-07-24

import os
import boto3
import csv
import io
import json
from decimal import Decimal
from datetime import datetime

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            else:
                return float(obj)
        return super().default(obj)

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    s3 = boto3.client('s3')

    feedback_table_name = os.environ.get('FEEDBACK_TABLE_NAME', 'DALScooterFeedback')
    s3_bucket = os.environ.get('FEEDBACK_EXPORT_BUCKET')

    if not feedback_table_name or not s3_bucket:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Missing environment variables for table or bucket.'})
        }

    feedback_table = dynamodb.Table(feedback_table_name)
    feedback_items = []
    last_evaluated_key = None

    # Only export feedback with completed sentiment analysis
    while True:
        scan_kwargs = {
            'FilterExpression': 'sentiment <> :pending',
            'ExpressionAttributeValues': {':pending': "PENDING_ANALYSIS"}
        }
        if last_evaluated_key:
            scan_kwargs['ExclusiveStartKey'] = last_evaluated_key
        response = feedback_table.scan(**scan_kwargs)
        feedback_items.extend(response.get('Items', []))
        last_evaluated_key = response.get('LastEvaluatedKey')
        if not last_evaluated_key:
            break

    if not feedback_items:
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'No feedback data found to export.'})
        }

    # Prepare CSV
    output = io.StringIO()
    fieldnames = sorted({k for item in feedback_items for k in item.keys()})
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for item in feedback_items:
        row = json.loads(json.dumps(item, cls=DecimalEncoder))
        writer.writerow(row)

    csv_data = output.getvalue()
    output.close()

    # Create/append to a single latest CSV file
    latest_key = "feedback_exports/latest_feedback_data.csv"
    try:
        # Get existing latest data
        latest_obj = s3.get_object(Bucket=s3_bucket, Key=latest_key)
        latest_csv = latest_obj['Body'].read().decode('utf-8')
        latest_reader = csv.DictReader(io.StringIO(latest_csv))
        latest_data = list(latest_reader)
        existing_ids = {f"{item.get('feedbackId')}_{item.get('timestamp')}" for item in latest_data}
        current_items_dict = []
        for item in feedback_items:
            item_dict = json.loads(json.dumps(item, cls=DecimalEncoder))
            current_items_dict.append(item_dict)
        new_records = 0
        for item in current_items_dict:
            composite_key = f"{item.get('feedbackId')}_{item.get('timestamp')}"
            if composite_key not in existing_ids:
                latest_data.append(item)
                new_records += 1
        # Re-generate CSV with combined data
        latest_output = io.StringIO()
        if latest_data:
            fieldnames = sorted({k for item in latest_data for k in item.keys()})
            writer = csv.DictWriter(latest_output, fieldnames=fieldnames)
            writer.writeheader()
            for item in latest_data:
                writer.writerow(item)
            latest_csv_data = latest_output.getvalue()
            latest_output.close()
        else:
            latest_csv_data = csv_data
    except Exception as e:
        print(f"Error processing latest data: {e}")
        latest_csv_data = csv_data

    # Upload the latest CSV
    s3.put_object(
        Bucket=s3_bucket,
        Key=latest_key,
        Body=latest_csv_data.encode('utf-8'),
        ContentType='text/csv'
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Feedback exported successfully.',
            'latest_url': f"s3://{s3_bucket}/{latest_key}",
            'record_count': len(feedback_items)
        }, cls=DecimalEncoder)
    }
