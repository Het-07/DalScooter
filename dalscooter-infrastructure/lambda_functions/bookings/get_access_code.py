import json
import boto3
import os
from decimal import Decimal
from datetime import datetime

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
        booking_reference_code = event['pathParameters']['booking_reference_code']
        customer_id = event['requestContext']['authorizer']['claims']['sub'] # User ID from Cognito

        if not booking_reference_code:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing booking_reference_code in path'})
            }

        response = bookings_table.get_item(Key={'bookingReferenceCode': booking_reference_code})
        booking = response.get('Item')

        if not booking:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Booking not found'})
            }
        
        # Ensure the requesting user owns this booking
        if booking.get('userId') != customer_id:
            return {
                'statusCode': 403, # Forbidden
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Access denied: You do not own this booking.'})
            }

        # Only provide access code if booking is 'approved' and not past its end time
        if booking.get('status') == 'approved':
            # Calculate duration (example: in hours)
            start_time_str = booking.get('startTime')
            end_time_str = booking.get('endTime')
            duration = "N/A"
            if start_time_str and end_time_str:
                try:
                    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                    time_diff = end_time - start_time
                    duration_hours = time_diff.total_seconds() / 3600
                    duration = f"{duration_hours:.2f} hours"
                except ValueError:
                    print("WARNING: Could not parse start_time or end_time for duration calculation.")

            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'accessCode': booking.get('accessCode'),
                    'duration': duration,
                    'status': booking.get('status')
                }, cls=DecimalEncoder)
            }
        else:
            return {
                'statusCode': 409, # Conflict
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'Booking status is {booking.get("status")}. Access code not available yet.'})
            }

    except KeyError as e:
        print(f"KeyError: {e}")
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Missing data in request or context: {str(e)}'})
        }
    except Exception as e:
        print(f"ERROR: Unhandled exception in get_access_code: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }