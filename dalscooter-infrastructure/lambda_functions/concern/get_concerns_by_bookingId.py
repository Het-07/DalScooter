import boto3
import json
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    try:
        # For GET method with query parameters
        booking_id = event.get('queryStringParameters', {}).get('bookingId')
        
        if not booking_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Missing 'bookingId' in query parameters"}),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            }

        table = dynamodb.Table("CustomerConcerns")
        response = table.scan(
            FilterExpression=Attr('bookingId').eq(booking_id)
        )

        return {
            "statusCode": 200,
            "body": json.dumps(response['Items']),
            'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
        }

    except Exception as e:
        print(f"Error occurred during lambda execution: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"}),
            'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
        }
