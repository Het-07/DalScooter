import json
import boto3
import os
from decimal import Decimal
from botocore.exceptions import ClientError
import traceback

# Custom JSON encoder to handle Decimal types
class DecimalEncoder(json.JSONEncoder):
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

    # Role-based Authorization Check (Lambda-side)
    user_groups = event.get('requestContext', {}).get('authorizer', {}).get('claims', {}).get('cognito:groups', [])
    if isinstance(user_groups, str): # Handle single group as string
        user_groups = [user_groups]
    
    if "AdminGroup" not in user_groups:
        print(f"Authorization failed: User not in AdminGroup. Groups: {user_groups}")
        return {
            'statusCode': 403,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Forbidden: Only Franchise Operators can view all bookings.'})
        }

    dynamodb = boto3.resource('dynamodb')
    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooter_Bookings')

    if not bookings_table_name:
        print("ERROR: Environment variable BOOKINGS_TABLE_NAME not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: Table name not set.'})
        }
    
    bookings_table = dynamodb.Table(bookings_table_name)

    try:
        # Scan the entire bookings table.
        # WARNING: For very large tables, a scan can be inefficient and costly.
        # In a production system, you might implement pagination, filters, or
        # use a GSI if specific query patterns for "all bookings" are common.
        response = bookings_table.scan()
        
        all_bookings = response.get('Items', [])
        print(f"Found {len(all_bookings)} booking items.")

        # If you need to handle pagination for large result sets,
        # you would add logic here to continue scanning using LastEvaluatedKey.
        # For this project scope, a single scan is usually sufficient.

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'All bookings retrieved successfully.',
                'bookings': all_bookings
            }, cls=DecimalEncoder)
        }

    except ClientError as e:
        print(f"ERROR: DynamoDB Client Error retrieving all bookings: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Error retrieving all bookings: {e.response["Error"]["Message"]}'})
        }
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in get_all_bookings: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }