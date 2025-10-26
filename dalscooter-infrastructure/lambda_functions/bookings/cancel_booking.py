import json
import boto3
import os
from botocore.exceptions import ClientError
from datetime import datetime, timedelta, timezone # Import timezone here

def lambda_handler(event, context):
    print(f"START RequestId: {context.aws_request_id}")
    print(f"Incoming event: {json.dumps(event)}")

    dynamodb = boto3.resource('dynamodb')
    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooter_Bookings')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooter_Bikes')

    if not bookings_table_name or not bikes_table_name:
        print("ERROR: Environment variables for tables not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: Table names not set.'})
        }
    
    bookings_table = dynamodb.Table(bookings_table_name)
    bikes_table = dynamodb.Table(bikes_table_name)

    try:
        booking_id = event['pathParameters']['booking_reference_code']
        print(f"Booking ID: {booking_id}")
        customer_id = event['requestContext']['authorizer']['claims']['sub']

        if not booking_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing booking_id in path parameters'})
            }

        # 1. Get booking to verify ownership and status
        response = bookings_table.get_item(Key={'bookingReferenceCode': booking_id})
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
        
        if booking.get('userId') != customer_id:
            return {
                'statusCode': 403, # Forbidden
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Access denied: You do not own this booking.'})
            }

        current_status = booking.get('status')
        if current_status not in ['pending_approval', 'approved']:
            return {
                'statusCode': 409, # Conflict
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'Booking cannot be cancelled in {current_status} status.'})
            }
        
        # Check if cancellation is too close to start time (optional business rule)
        start_time = datetime.fromisoformat(booking['startTime'].replace('Z', '+00:00'))
        
        # --- FIX START ---
        # Make the current UTC time timezone-aware
        current_utc_time = datetime.now(timezone.utc) 

        # Now compare two timezone-aware datetimes
        if start_time < current_utc_time + timedelta(hours=1): # Example: Cannot cancel within 1 hour of start
        # --- FIX END ---
            # You might want to implement a refund policy here too
            return {
                'statusCode': 409,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Cannot cancel booking within 1 hour of start time.'})
            }

        # 2. Update booking status to 'cancelled'
        bookings_table.update_item(
            Key={'bookingReferenceCode': booking_id},
            UpdateExpression="SET #s = :status, cancelledAt = :timestamp",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":status": "cancelled",
                ":timestamp": datetime.utcnow().isoformat(timespec='milliseconds') + 'Z' # datetime.utcnow() is fine here as you're just formatting for storage
            }
        )

        # 3. If bike was 'pending' or 'in-use' for this booking, set it back to 'available'
        bike_id = booking.get('bikeId')
        if bike_id:
            bikes_table.update_item(
                Key={'bikeId': bike_id},
                UpdateExpression="SET #s = :status",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":status": "available"}
            )

        print(f"Booking {booking_id} cancelled by user {customer_id}")

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Booking cancelled successfully.'})
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
    except ClientError as e:
        print(f"ERROR: DynamoDB Client Error cancelling booking: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Error cancelling booking: {e.response["Error"]["Message"]}'})
        }
    except Exception as e:
        print(f"ERROR: Unhandled exception in cancel_booking: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }