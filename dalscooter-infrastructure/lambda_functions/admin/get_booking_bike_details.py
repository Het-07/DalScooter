import json
import boto3
import os

def lambda_handler(event, context):

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
            'body': json.dumps({'message': 'Forbidden: Only Franchise Operators can add bikes.'})
        }
    
    dynamodb = boto3.resource('dynamodb')
    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME') # Need to get bike details too
    
    if not bookings_table_name or not bikes_table_name:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Environment variables BOOKINGS_TABLE_NAME or BIKES_TABLE_NAME not set'})
        }
    
    bookings_table = dynamodb.Table(bookings_table_name)
    bikes_table = dynamodb.Table(bikes_table_name)

    try:
        booking_reference_code = event['pathParameters']['booking_reference_code']

        if not booking_reference_code:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing booking_reference_code in path parameters'})
            }

        # 1. Get booking details
        booking_response = bookings_table.get_item(
            Key={'bookingReferenceCode': booking_reference_code}
        )
        booking = booking_response.get('Item')

        if not booking:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Booking not found'})
            }

        # 2. Get associated bike details
        bike_id = booking.get('bikeId')
        bike_response = bikes_table.get_item(
            Key={'bikeId': bike_id}
        )
        bike_details = bike_response.get('Item')

        response_payload = {
            'bookingDetails': booking,
            'bikeDetails': bike_details
        }

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(response_payload, default=str)
        }
    except KeyError:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Path parameter booking_reference_code is missing'})
        }
    except Exception as e:
        print(f"Error getting booking and bike details: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Could not retrieve details: {str(e)}'})
        }