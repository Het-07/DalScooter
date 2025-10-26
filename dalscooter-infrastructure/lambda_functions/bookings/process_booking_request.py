import json
import boto3
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
import traceback
import random

# Initialize SQS client globally for efficiency
sqs_client = boto3.client('sqs')
# Environment variable for your SQS queue URL
NOTIFICATION_QUEUE_URL = os.environ.get('NOTIFICATION_QUEUE_URL')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            else:
                return float(obj)
        return json.JSONEncoder.default(self, obj)

def generate_access_code():
    """Generates a simple 6-digit numeric access code."""
    return str(random.randint(100000, 999999))

def format_to_cron_expression(dt_object_utc):
    """
    Formats a UTC datetime object into an EventBridge cron expression
    for a specific date and time.
    Format: cron(Minutes Hours Day-of-month Month Day-of-week Year)
    """
    minute = dt_object_utc.minute
    hour = dt_object_utc.hour
    day_of_month = dt_object_utc.day
    month = dt_object_utc.month
    year = dt_object_utc.year
    
    # Day-of-week is '?' when Day-of-month is specified
    return f"cron({minute} {hour} {day_of_month} {month} ? {year})"

def send_email_notification(user_email, subject, body_text):
    """
    Sends a pre-formatted email notification message to the SQS queue.
    """
    if not NOTIFICATION_QUEUE_URL:
        print("ERROR: NOTIFICATION_QUEUE_URL environment variable not set. Cannot send notification.")
        return

    message_body = {
        "to": user_email,
        "subject": subject,
        "body": body_text
    }

    try:
        response = sqs_client.send_message(
            QueueUrl=NOTIFICATION_QUEUE_URL,
            MessageBody=json.dumps(message_body) # No DecimalEncoder needed if body is just string
        )
        print(f"Email notification message sent to SQS: {response['MessageId']}")
    except ClientError as e:
        print(f"ERROR: SQS Client Error sending notification message: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
        print(traceback.format_exc())
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception sending notification message: {e}")
        print(traceback.format_exc())


def lambda_handler(event, context):
    print(f"START RequestId: {context.aws_request_id}")
    print(f"Incoming SQS event: {json.dumps(event)}")

    dynamodb = boto3.resource('dynamodb')
    events_client = boto3.client('events')

    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooterBookings')
    bikes_table_name = os.environ.get('BIKES_TABLE_name', 'DALScooterBikes')
    scheduled_status_update_lambda_arn = os.environ.get('SCHEDULED_STATUS_UPDATE_LAMBDA_ARN')
    
    if not all([bookings_table_name, bikes_table_name, scheduled_status_update_lambda_arn, NOTIFICATION_QUEUE_URL]):
        print("ERROR: Environment variables for tables, scheduled status update Lambda ARN, or Notification SQS URL not set.")
        raise ValueError('Configuration error: Missing environment variables.')

    bookings_table = dynamodb.Table(bookings_table_name)
    bikes_table = dynamodb.Table(bikes_table_name)

    for record in event['Records']:
        booking_ref_code = "UNKNOWN"
        user_id = "UNKNOWN"
        user_email = "default_user@example.com" # Placeholder: **IMPORTANT - Get actual user email**

        try:
            message_body = json.loads(record['body'])
            booking_ref_code = message_body.get('bookingReferenceCode')
            user_id = message_body.get('userId')
            bike_id = message_body.get('bikeId')
            bike_type = message_body.get('bikeType')
            start_time_str = message_body.get('startTime')
            end_time_str = message_body.get('endTime')
            created_at_str = message_body.get('createdAt')
            rate_per_hour = message_body.get('ratePerHour')
            # Assuming user_email is also part of the initial SQS message from PostAuthentication
            # This is CRITICAL: Ensure your PostAuthentication Lambda passes the user's email here
            user_email = message_body.get('userEmail', 'mihir20011patel@gmail.com') 

            print(f"Processing booking request: {booking_ref_code} for bike {bike_id} by user {user_id}")

            if not all([booking_ref_code, user_id, bike_id, start_time_str, end_time_str, bike_type, created_at_str]):
                error_msg = "Missing critical booking data in the request."
                print(f"WARNING: {error_msg} Skipping record for booking {booking_ref_code}.")
                send_email_notification(
                    user_email=user_email,
                    subject="DalScooter Booking Failed: Missing Data",
                    body_text=f"Dear User,\n\nWe could not process your booking request ({booking_ref_code}) because of missing information. Details: {error_msg}\n\nPlease ensure all required fields are provided and try again.\n\nRegards,\nDalScooter Team"
                )
                continue

            start_time_utc = datetime.fromisoformat(start_time_str.replace('Z', '+00:00')).astimezone(timezone.utc)
            end_time_utc = datetime.fromisoformat(end_time_str.replace('Z', '+00:00')).astimezone(timezone.utc)
            current_utc_time = datetime.now(timezone.utc)

            # Check if scheduled time is in the past
            if start_time_utc < current_utc_time:
                error_msg = f"Booking start time {start_time_utc.isoformat()} is in the past. Bookings must be in the future."
                print(f"WARNING: {error_msg} Rejecting booking {booking_ref_code}.")
                rejected_booking_item = {
                    'bookingReferenceCode': booking_ref_code, 'userId': user_id, 'bikeId': bike_id, 'bikeType': bike_type,
                    'startTime': start_time_str, 'endTime': end_time_str, 'status': 'rejected',
                    'createdAt': created_at_str, 'rejectedAt': current_utc_time.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
                }
                if rate_per_hour is not None: rejected_booking_item['ratePerHour'] = rate_per_hour
                bookings_table.put_item(Item=rejected_booking_item)
                
                send_email_notification(
                    user_email=user_email,
                    subject="DalScooter Booking Failed: Invalid Time",
                    body_text=f"Dear User,\n\nYour booking request ({booking_ref_code}) could not be processed because the start time is in the past. Details: {error_msg}\n\nPlease select a future time for your booking.\n\nRegards,\nDalScooter Team"
                )
                continue
            
            bike_response = bikes_table.get_item(Key={'bikeId': bike_id})
            bike = bike_response.get('Item')

            if not bike or bike.get('status') != 'available':
                error_msg = f"Bike {bike_id} is not available (current status: {bike.get('status') if bike else 'not found'})."
                print(f"{error_msg} Rejecting booking {booking_ref_code}.")
                rejected_booking_item = {
                    'bookingReferenceCode': booking_ref_code, 'userId': user_id, 'bikeId': bike_id, 'bikeType': bike_type,
                    'startTime': start_time_str, 'endTime': end_time_str, 'status': 'rejected',
                    'createdAt': created_at_str, 'rejectedAt': current_utc_time.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
                }
                if rate_per_hour is not None: rejected_booking_item['ratePerHour'] = rate_per_hour
                bookings_table.put_item(Item=rejected_booking_item)
                
                send_email_notification(
                    user_email=user_email,
                    subject="DalScooter Booking Failed: Bike Unavailable",
                    body_text=f"Dear User,\n\nWe're sorry, your booking request ({booking_ref_code}) for bike {bike_id} could not be completed because the bike is currently unavailable. Details: {error_msg}\n\nPlease try booking a different bike or a different time slot.\n\nRegards,\nDalScooter Team"
                )
                continue

            bookings_for_bike_response = bookings_table.query(
                IndexName='BikeIdStatusIndex',
                KeyConditionExpression=Key('bikeId').eq(bike_id)
            )
            
            existing_active_bookings = [
                b for b in bookings_for_bike_response.get('Items', [])
                if b.get('status') in ['active', 'pending_approval', 'approved']
            ]
            
            overlap_found = False
            for existing_booking in existing_active_bookings:
                if existing_booking.get('bookingReferenceCode') == booking_ref_code:
                    continue

                existing_start = datetime.fromisoformat(existing_booking['startTime'].replace('Z', '+00:00')).astimezone(timezone.utc)
                existing_end = datetime.fromisoformat(existing_booking['endTime'].replace('Z', '+00:00')).astimezone(timezone.utc)

                if (start_time_utc < existing_end) and (end_time_utc > existing_start):
                    overlap_found = True
                    break
            
            if overlap_found:
                error_msg = f"Time slot overlap detected for bike {bike_id} and booking {booking_ref_code}."
                print(f"{error_msg} Rejecting booking.")
                rejected_booking_item = {
                    'bookingReferenceCode': booking_ref_code, 'userId': user_id, 'bikeId': bike_id, 'bikeType': bike_type,
                    'startTime': start_time_str, 'endTime': end_time_str, 'status': 'rejected',
                    'createdAt': created_at_str, 'rejectedAt': current_utc_time.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
                }
                if rate_per_hour is not None: rejected_booking_item['ratePerHour'] = rate_per_hour
                bookings_table.put_item(Item=rejected_booking_item)
                
                send_email_notification(
                    user_email=user_email,
                    subject="DalScooter Booking Failed: Time Conflict",
                    body_text=f"Dear User,\n\nYour booking request ({booking_ref_code}) for bike {bike_id} could not be processed due to a time conflict with an existing booking. Details: {error_msg}\n\nPlease try booking a different time slot or a different bike.\n\nRegards,\nDalScooter Team"
                )
                continue

            # --- Booking Approved ---
            access_code = generate_access_code()
            
            approved_booking_item = {
                'bookingReferenceCode': booking_ref_code,
                'userId': user_id,
                'bikeId': bike_id,
                'bikeType': bike_type,
                'startTime': start_time_str,
                'endTime': end_time_str,
                'status': 'approved',
                'accessCode': access_code,
                'createdAt': created_at_str,
                'approvedAt': current_utc_time.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
            }
            if rate_per_hour is not None:
                approved_booking_item['ratePerHour'] = rate_per_hour
            bookings_table.put_item(Item=approved_booking_item)
            print(f"Booking {booking_ref_code} created with status 'approved'. Access Code: {access_code}")

            # --- Send Success Notification to SQS ---
            success_subject = "Your DalScooter Booking is Confirmed!"
            success_body = (
                f"Dear User,\n\nYour booking ({booking_ref_code}) for bike {bike_id} is confirmed!\n\n"
                f"Your unique access code is: {access_code}\n\n"
                f"Start Time: {start_time_str}\n"
                f"End Time: {end_time_str}\n\n"
                f"Enjoy your ride!\n\n"
                f"Regards,\nDalScooter Team"
            )
            send_email_notification(
                user_email=user_email,
                subject=success_subject,
                body_text=success_body
            )

            # EventBridge scheduling for booking start
            start_rule_name = f"dals-booking-start-{booking_ref_code}"
            start_schedule_expression = format_to_cron_expression(start_time_utc)
            start_payload = {
                "bikeId": bike_id,
                "bookingReferenceCode": booking_ref_code,
                "newBikeStatus": "in-use",
                "newBookingStatus": "active",
                "action": "start_booking"
            }
            try:
                print(f"Attempting to put EventBridge rule '{start_rule_name}' with ScheduleExpression: '{start_schedule_expression}'")
                events_client.put_rule(
                    Name=start_rule_name,
                    ScheduleExpression=start_schedule_expression,
                    State='ENABLED'
                )
                events_client.put_targets(
                    Rule=start_rule_name,
                    Targets=[
                        {
                            'Id': '1',
                            'Arn': scheduled_status_update_lambda_arn,
                            'Input': json.dumps(start_payload)
                        }
                    ]
                )
                print(f"Scheduled EventBridge rule '{start_rule_name}' for booking start time.")
            except ClientError as e:
                # Log error, but don't re-send failure notification as booking is already approved
                print(f"ERROR: EventBridge Client Error scheduling start rule: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
                print(f"Problematic ScheduleExpression for start rule was: '{start_schedule_expression}'")
                print(traceback.format_exc())

            # EventBridge scheduling for booking end
            end_rule_name = f"dals-booking-end-{booking_ref_code}"
            end_schedule_expression = format_to_cron_expression(end_time_utc)
            end_payload = {
                "bikeId": bike_id,
                "bookingReferenceCode": booking_ref_code,
                "newBikeStatus": "available",
                "newBookingStatus": "completed",
                "action": "end_booking",
                "cleanupRules": [start_rule_name, end_rule_name]
            }
            try:
                print(f"Attempting to put EventBridge rule '{end_rule_name}' with ScheduleExpression: '{end_schedule_expression}'")
                events_client.put_rule(
                    Name=end_rule_name,
                    ScheduleExpression=end_schedule_expression,
                    State='ENABLED'
                )
                events_client.put_targets(
                    Rule=end_rule_name,
                    Targets=[
                        {
                            'Id': '1',
                            'Arn': scheduled_status_update_lambda_arn,
                            'Input': json.dumps(end_payload)
                        }
                    ]
                )
                print(f"Scheduled EventBridge rule '{end_rule_name}' for booking end time.")
            except ClientError as e:
                # Log error, but don't re-send failure notification as booking is already approved
                print(f"ERROR: EventBridge Client Error scheduling end rule: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
                print(f"Problematic ScheduleExpression for end rule was: '{end_schedule_expression}'")
                print(traceback.format_exc())

        except json.JSONDecodeError:
            print(f"ERROR: Invalid JSON in SQS message body for record ID: {record.get('messageId')}. Skipping record.")
            print(traceback.format_exc())
            # For malformed input messages, user_email might not be extractable.
            # This should likely go to a DLQ for the process_booking_request lambda itself.
        except ClientError as e:
            print(f"ERROR: Client Error during booking processing for {booking_ref_code}: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            print(traceback.format_exc())
            send_email_notification(
                user_email=user_email,
                subject="DalScooter Booking Failed: Service Error",
                body_text=f"Dear User,\n\nWe encountered an internal error while processing your booking ({booking_ref_code}). Details: {e.response['Error']['Message']}\n\nPlease try again later or contact support.\n\nRegards,\nDalScooter Team"
            )
            raise # Re-raise to trigger SQS DLQ/retry if it's a critical error for the batch
        except Exception as e:
            print(f"CRITICAL ERROR: Unhandled exception processing SQS record for {booking_ref_code}: {e}")
            print(traceback.format_exc())
            send_email_notification(
                user_email=user_email,
                subject="DalScooter Booking Failed: Unexpected Error",
                body_text=f"Dear User,\n\nAn unexpected error occurred while processing your booking ({booking_ref_code}). Details: {str(e)}\n\nPlease try again later or contact support.\n\nRegards,\nDalScooter Team"
            )
            raise # Re-raise for SQS DLQ/retry

    print(f"END RequestId: {context.aws_request_id}")
    return {
        'statusCode': 200,
        'body': json.dumps('SQS messages processed successfully or will be retried.')
    }