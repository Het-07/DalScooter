import json
import boto3
import os
import uuid
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

# Initialize SQS client globally for efficiency (for both queues)
sqs_client = boto3.client('sqs') 

def send_email_notification(user_email, subject, body_text):
    """
    Sends a pre-formatted email notification message to the SQS queue.
    """
    notification_queue_url = os.environ.get('NOTIFICATION_QUEUE_URL')
    if not notification_queue_url:
        print("ERROR: NOTIFICATION_QUEUE_URL environment variable not set. Cannot send notification.")
        return

    message_body = {
        "to": user_email,
        "subject": subject,
        "body": body_text
    }

    try:
        response = sqs_client.send_message(
            QueueUrl=notification_queue_url,
            MessageBody=json.dumps(message_body)
        )
        print(f"Email notification message sent to SQS for {user_email}: {response['MessageId']}")
    except ClientError as e:
        print(f"ERROR: SQS Client Error sending notification message: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
        print(traceback.format_exc())
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception sending notification message: {e}")
        print(traceback.format_exc())


def lambda_handler(event, context):
    print(f"START RequestId: {context.aws_request_id}")
    print(f"Incoming event: {json.dumps(event)}")

    dynamodb = boto3.resource('dynamodb')

    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooter_Bookings')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooter_Bikes')
    booking_requests_queue_url = os.environ.get('BOOKING_REQUESTS_QUEUE_URL') # For successful booking requests
    notification_queue_url = os.environ.get('NOTIFICATION_QUEUE_URL') # For general email notifications

    if not bookings_table_name or not bikes_table_name or not booking_requests_queue_url or not notification_queue_url:
        print("ERROR: One or more environment variables for tables or SQS queues not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: Required environment variables not set.'})
        }

    bikes_table = dynamodb.Table(bikes_table_name)
    bookings_table = dynamodb.Table(bookings_table_name)

    customer_id = None
    user_email = None # Initialize user_email

    try:
        # Extract customer_id and user_email from Cognito claims
        if 'requestContext' in event and 'authorizer' in event['requestContext'] and \
           'claims' in event['requestContext']['authorizer']:
            claims = event['requestContext']['authorizer']['claims']
            customer_id = claims.get('sub')
            user_email = claims.get('email') # Assuming 'email' claim exists for the user's email

        if not customer_id:
            print("ERROR: User ID (sub) not found in Cognito claims.")
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Unauthorized: User ID not found in token.'})
            }

        # If user_email is not found, use a default or log a warning.
        # Ideally, it should always be present if your Cognito setup is standard.
        if not user_email:
            print(f"WARNING: User email not found in Cognito claims for customer_id: {customer_id}. Using placeholder.")
            user_email = "no-email-provided@example.com" # Fallback, but you want a real email here

        body = json.loads(event.get('body', '{}'))
        
        bike_id = body.get('bikeId')
        start_time_str = body.get('startTime')
        end_time_str = body.get('endTime')

        if not all([bike_id, start_time_str, end_time_str]):
            send_email_notification(
                user_email=user_email,
                subject="DalScooter Booking Failed: Missing Information",
                body_text="Dear User,\n\nYour booking request could not be processed due to missing required fields (bike ID, start time, or end time).\n\nPlease try again with all necessary information.\n\nRegards,\nDalScooter Team"
            )
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing required fields: bikeId, startTime, endTime'})
            }

        try:
            start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00')).astimezone(timezone.utc)
            end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00')).astimezone(timezone.utc)
            
            if start_time >= end_time:
                send_email_notification(
                    user_email=user_email,
                    subject="DalScooter Booking Failed: Invalid Times",
                    body_text="Dear User,\n\nYour booking request could not be processed because the start time must be before the end time.\n\nPlease adjust your booking times and try again.\n\nRegards,\nDalScooter Team"
                )
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'Start time must be before end time'})
                }
            
            current_utc_time = datetime.now(timezone.utc)
            # Allow a small buffer (e.g., 2 minutes) for current time.
            # If the current time is 6:28 PM ADT (21:28 UTC), and startTime is 21:27 UTC, it's problematic.
            # Let's say we allow bookings from current time + 5 minutes.
            # Use `current_utc_time` to be precise.
            if start_time < current_utc_time - timedelta(minutes=1): # Allow 1 minute grace for API latency
                send_email_notification(
                    user_email=user_email,
                    subject="DalScooter Booking Failed: Past Time",
                    body_text="Dear User,\n\nYour booking request could not be processed because the start time is in the past.\n\nPlease select a future time for your booking.\n\nRegards,\nDalScooter Team"
                )
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'Cannot book in the past'})
                }
        except ValueError:
            send_email_notification(
                user_email=user_email,
                subject="DalScooter Booking Failed: Invalid Date/Time Format",
                body_text="Dear User,\n\nYour booking request could not be processed due to an invalid date or time format. Please use ISO 8601 format (e.g., 2025-07-15T10:00:00.000Z).\n\nRegards,\nDalScooter Team"
            )
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Invalid date/time format. Use ISO 8601 (e.g., 2025-07-15T10:00:00.000Z).'})
            }

        try:
            bike_response = bikes_table.get_item(Key={'bikeId': bike_id})
            bike = bike_response.get('Item')

            if not bike:
                send_email_notification(
                    user_email=user_email,
                    subject="DalScooter Booking Failed: Bike Not Found",
                    body_text=f"Dear User,\n\nYour booking request for bike ID {bike_id} could not be processed because the specified bike was not found.\n\nPlease check the bike ID and try again.\n\nRegards,\nDalScooter Team"
                )
                return {
                    'statusCode': 404,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'Bike not found'})
                }
            if bike.get('status') != 'available':
                current_bike_status = bike.get('status')
                send_email_notification(
                    user_email=user_email,
                    subject="DalScooter Booking Failed: Bike Unavailable",
                    body_text=f"Dear User,\n\nYour booking request for bike ID {bike_id} could not be processed because the bike is currently unavailable (Status: {current_bike_status}).\n\nPlease choose an available bike or a different time slot.\n\nRegards,\nDalScooter Team"
                )
                return {
                    'statusCode': 409, # Conflict
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': f'Bike is not available. Current status: {bike.get("status")}'})
                }
        except ClientError as e:
            print(f"ERROR: DynamoDB Client Error fetching bike for pre-check: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            print(traceback.format_exc())
            send_email_notification(
                user_email=user_email,
                subject="DalScooter Booking Failed: Service Error",
                body_text=f"Dear User,\n\nWe encountered an internal error while checking bike availability. Please try again later.\nError: {e.response['Error']['Message']}\n\nRegards,\nDalScooter Team"
            )
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'Error during initial bike availability check: {e.response["Error"]["Message"]}'})
            }

        try:
            bookings_for_bike_response = bookings_table.query(
                IndexName='BikeIdStatusIndex',
                KeyConditionExpression=Key('bikeId').eq(bike_id)
            )
            
            existing_active_bookings = [
                b for b in bookings_for_bike_response.get('Items', [])
                if b.get('status') in ['active', 'pending_approval', 'approved']
            ]
            
            for existing_booking in existing_active_bookings:
                existing_start = datetime.fromisoformat(existing_booking['startTime'].replace('Z', '+00:00')).astimezone(timezone.utc)
                existing_end = datetime.fromisoformat(existing_booking['endTime'].replace('Z', '+00:00')).astimezone(timezone.utc)

                if (start_time < existing_end) and (end_time > existing_start):
                    send_email_notification(
                        user_email=user_email,
                        subject="DalScooter Booking Failed: Time Slot Conflict",
                        body_text=f"Dear User,\n\nYour booking request for bike ID {bike_id} from {start_time_str} to {end_time_str} could not be processed due to a time conflict with an existing booking.\n\nPlease choose a different time slot or a different bike.\n\nRegards,\nDalScooter Team"
                    )
                    return {
                        'statusCode': 409, # Conflict
                        'headers': {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'application/json'
                        },
                        'body': json.dumps({'message': 'Bike is already booked or pending approval for the requested time slot.'})
                    }
        except ClientError as e:
            print(f"ERROR: DynamoDB Client Error checking booking overlaps for pre-check: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            print(traceback.format_exc())
            send_email_notification(
                user_email=user_email,
                subject="DalScooter Booking Failed: Service Error",
                body_text=f"Dear User,\n\nWe encountered an internal error while checking for booking overlaps. Please try again later.\nError: {e.response['Error']['Message']}\n\nRegards,\nDalScooter Team"
            )
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'Error during initial booking overlap check: {e.response["Error"]["Message"]}'})
            }

        # If all pre-checks pass, send to the processing queue
        booking_reference_code = str(uuid.uuid4())
        booking_request_message = {
            'bookingReferenceCode': booking_reference_code,
            'userId': customer_id,
            'userEmail': user_email, # Pass user email to the next Lambda
            'bikeId': bike_id,
            'bikeType': bike.get('model'),
            'startTime': start_time_str,
            'endTime': end_time_str,
            'createdAt': datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
        }

        # Add ratePerHour if it exists on the bike item
        if 'ratePerHour' in bike:
            booking_request_message['ratePerHour'] = bike['ratePerHour']


        try:
            sqs_client.send_message(
                QueueUrl=booking_requests_queue_url,
                MessageBody=json.dumps(booking_request_message, cls=DecimalEncoder) # Use DecimalEncoder for this message
            )
            print(f"Booking request for {booking_reference_code} sent to SQS queue.")

        except ClientError as e:
            print(f"ERROR: SQS Client Error sending booking request message: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            print(traceback.format_exc())
            send_email_notification(
                user_email=user_email,
                subject="DalScooter Booking Failed: Internal Error",
                body_text=f"Dear User,\n\nWe encountered an internal error while submitting your booking request. Please try again later.\nError: {e.response['Error']['Message']}\n\nRegards,\nDalScooter Team"
            )
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'Error sending booking request to queue: {e.response["Error"]["Message"]}'})
            }

        return {
            'statusCode': 202, # Accepted
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Booking request submitted successfully. Processing in background. You will receive an email shortly.',
                'bookingReferenceCode': booking_reference_code
            })
        }

    except json.JSONDecodeError:
        # This occurs if event.get('body') is not valid JSON
        # user_email might not be available here, so a generic error to frontend
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Invalid JSON in request body'})
        }
    except KeyError as e:
        print(f"ERROR: Missing expected key in event or body: {e}")
        print(traceback.format_exc())
        # user_email might not be available here
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Missing data in request or context: {str(e)}'})
        }
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in reserve_booking: {e}")
        print(traceback.format_exc())
        # Best effort to send email if user_email is available, otherwise just return API error
        if user_email:
            send_email_notification(
                user_email=user_email,
                subject="DalScooter Booking Failed: Unexpected Error",
                body_text=f"Dear User,\n\nAn unexpected error occurred while trying to reserve your scooter. Please try again later.\nError: {str(e)}\n\nRegards,\nDalScooter Team"
            )
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }