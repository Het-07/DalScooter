import json
import boto3
import os
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
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
    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooterBookings')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooterBikes') # ADDED: Get bikes table name

    if not bookings_table_name:
        print("ERROR: Environment variable BOOKINGS_TABLE_NAME not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: Bookings table name not set.'})
        }

    if not bikes_table_name: # ADDED: Check for bikes table name
        print("ERROR: Environment variable BIKES_TABLE_NAME not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: Bikes table name not set.'})
        }

    bookings_table = dynamodb.Table(bookings_table_name)
    bikes_table = dynamodb.Table(bikes_table_name) # ADDED: Initialize bikes table

    try:
        customer_id = event['requestContext']['authorizer']['claims']['sub']
        query_params = event.get('queryStringParameters', {})
        status_filter = None
        if query_params:
            status_filter = query_params.get('status')

        query_kwargs = {
            'IndexName': 'UserIdIndex', # Assuming UserIdIndex is the GSI on userId
            'KeyConditionExpression': Key('userId').eq(customer_id)
        }

        if status_filter:
            query_kwargs['FilterExpression'] = Attr('status').eq(status_filter)

        response = bookings_table.query(**query_kwargs)
        bookings = response.get('Items', [])

        # Fetch bike location for each booking
        for booking in bookings:
            bike_id = booking.get('bikeId')
            if bike_id:
                try:
                    bike_response = bikes_table.get_item(Key={'bikeId': bike_id})
                    bike_item = bike_response.get('Item')
                    if bike_item and bike_item.get('location'):
                        booking['location'] = bike_item['location']
                    else:
                        booking['location'] = 'Unknown Location' # Fallback if bike or location not found
                except ClientError as e:
                    print(f"Error fetching bike details for bikeId {bike_id}: {e}")
                    booking['location'] = 'Error Fetching Location'
            else:
                booking['location'] = 'No Bike ID' # Fallback if booking lacks bikeId

        bookings.sort(key=lambda x: x.get('startTime', ''), reverse=True)

        print(f"Found {len(bookings)} bookings for user {customer_id}.")

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Booking history retrieved successfully',
                'bookings': bookings
            }, cls=DecimalEncoder)
        }

    except KeyError as e:
        print(f"KeyError: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Missing data in request or context: {str(e)}'})
        }
    except Exception as e:
        print(f"ERROR: Unhandled exception in get_booking_history: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }