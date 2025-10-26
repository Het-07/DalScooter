import boto3
import json

from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    try:
        # Parse body (API Gateway proxy sends body as string)
        body = json.loads(event.get('body', '{}'))
        username = body.get('username')
        booking_id = body.get('bookingId')
        message = body.get('message')

        if not username or not booking_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Missing username or bookingCode'}),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            }

        table = dynamodb.Table("CustomerConcerns")
        
        # Modified key access logic
        get_response = table.get_item(Key={'bookingId': booking_id})
        item = get_response.get('Item')

        if not item or item.get('assigned_to') != username:
            return {
                'statusCode': 404,
                'body': json.dumps({'message': 'Concern not found or not assigned to this user'}),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            }

        current_concern = item.get('concern', '')
        new_concern = f"{current_concern}\nAdmin comments: {message}"

        # Update using bookingId only
        update_response = table.update_item(
            Key={'bookingId': booking_id},
            UpdateExpression="SET #s = :new_status, #c = :new_concern",
            ExpressionAttributeNames={
                '#s': 'status',
                '#c': 'concern'
            },
            ExpressionAttributeValues={
                ':new_status': 'CLOSED',
                ':new_concern': new_concern
            },
            ReturnValues="UPDATED_NEW"
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Concern resolved successfully'}),
            'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
        }
        
    except Exception as e:
        print(f"Error occurred during lambda execution: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal server error'}),
            'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
        }
