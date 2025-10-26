import json
import boto3
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
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
        path_parameters = event.get('pathParameters', {})
        print(f"path_parameters: {path_parameters} (Type: {type(path_parameters)})")

        # CORRECTED: Extract 'booking_reference_code' as it's the actual key from API Gateway
        booking_id = path_parameters.get('booking_reference_code')
        print(f"Extracted booking_id (from booking_reference_code): {booking_id}")

        customer_id = event['requestContext']['authorizer']['claims']['sub']
        body = json.loads(event.get('body', '{}'))

        new_start_time_str = body.get('new_start_time')
        new_end_time_str = body.get('new_end_time')

        # Ensure booking_id is not None before proceeding
        if not booking_id:
            print("ERROR: booking_id is missing from path parameters.")
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing booking_id in path parameters'})
            }

        if not all([new_start_time_str, new_end_time_str]): # booking_id is checked above
            print("ERROR: Missing required fields for update (new_start_time, new_end_time).")
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing required fields: new_start_time, new_end_time'})
            }
        
        try:
            new_start_time = datetime.fromisoformat(new_start_time_str.replace('Z', '+00:00'))
            new_end_time = datetime.fromisoformat(new_end_time_str.replace('Z', '+00:00'))
            
            if new_start_time >= new_end_time:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'New start time must be before new end time'})
                }
            
            current_utc_time = datetime.now(timezone.utc)
            if new_start_time < current_utc_time - timedelta(minutes=5):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'Cannot update booking to a past time.'})
                }
        except ValueError:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Invalid date/time format for new times. Use ISO 8601.'})
            }

        try:
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
                    'statusCode': 403,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'Access denied: You do not own this booking.'})
                }

            current_status = booking.get('status')
            if current_status not in ['pending_approval', 'approved']:
                return {
                    'statusCode': 409,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': f'Booking cannot be updated in {current_status} status.'})
                }
            
            bike_id_from_booking = booking.get('bikeId')
            
            bookings_for_bike_response = bookings_table.query(
                IndexName='BikeIdStatusIndex',
                KeyConditionExpression=Key('bikeId').eq(bike_id_from_booking)
            )
            
            existing_active_bookings = [
                b for b in bookings_for_bike_response.get('Items', [])
                if b.get('status') in ['active', 'approved', 'pending_approval']
            ]
            
            for existing_booking in existing_active_bookings:
                if existing_booking.get('bookingReferenceCode') == booking_id:
                    continue

                existing_start = datetime.fromisoformat(existing_booking['startTime'].replace('Z', '+00:00'))
                existing_end = datetime.fromisoformat(existing_booking['endTime'].replace('Z', '+00:00'))

                if (new_start_time < existing_end) and (new_end_time > existing_start):
                    return {
                        'statusCode': 409,
                        'headers': {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'application/json'
                        },
                        'body': json.dumps({'message': 'New time slot overlaps with an existing booking for this bike.'})
                    }

            bookings_table.update_item(
                Key={'bookingReferenceCode': booking_id},
                UpdateExpression="SET startTime = :new_start, endTime = :new_end, updatedAt = :timestamp",
                ExpressionAttributeValues={
                    ":new_start": new_start_time_str,
                    ":new_end": new_end_time_str,
                    ":timestamp": datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
                },
                ReturnValues="ALL_NEW"
            )

            print(f"Booking {booking_id} updated by user {customer_id}")

            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'message': 'Booking updated successfully.',
                    'updatedBooking': bookings_table.get_item(Key={'bookingReferenceCode': booking_id}).get('Item')
                }, cls=DecimalEncoder)
            }
        except ClientError as e:
            print(f"ERROR: DynamoDB Client Error updating booking: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            print(traceback.format_exc())
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'Error updating booking: {e.response["Error"]["Message"]}'})
            }
        except Exception as e:
            print(f"ERROR: Unhandled exception in update_booking (inner try): {e}")
            print(traceback.format_exc())
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
            }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Invalid JSON in request body'})
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
        print(f"CRITICAL ERROR: Unhandled exception in update_booking (outer): {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }