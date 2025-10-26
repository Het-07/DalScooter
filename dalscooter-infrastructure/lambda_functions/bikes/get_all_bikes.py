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

    dynamodb = boto3.resource('dynamodb')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooter_Bikes')

    if not bikes_table_name:
        print("ERROR: Environment variable BIKES_TABLE_NAME not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: Bikes table name not set.'})
        }

    bikes_table = dynamodb.Table(bikes_table_name)

    try:
        # Scan the entire table to get all bikes, regardless of status
        response = bikes_table.scan()
        bikes = response.get('Items', [])

        # Handle pagination if needed (for very large tables)
        while 'LastEvaluatedKey' in response:
            response = bikes_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            bikes.extend(response.get('Items', []))

        print(f"Found {len(bikes)} bikes in total.")

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*', # Allow all origins for development
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'All bikes retrieved successfully.',
                'bikes': bikes
            }, cls=DecimalEncoder)
        }

    except ClientError as e:
        print(f"ERROR: DynamoDB Client Error retrieving all bikes: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Error retrieving all bikes: {e.response["Error"]["Message"]}'})
        }
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in get_all_bikes: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }