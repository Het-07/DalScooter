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
    print(f"Incoming EventBridge event: {json.dumps(event)}")

    dynamodb = boto3.resource('dynamodb')
    events_client = boto3.client('events') # For deleting rules

    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooter_Bikes')
    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooter_Bookings')

    if not bikes_table_name or not bookings_table_name:
        print("ERROR: Environment variables for tables not set.")
        raise ValueError('Configuration error: DynamoDB table names not set.')

    bikes_table = dynamodb.Table(bikes_table_name)
    bookings_table = dynamodb.Table(bookings_table_name)

    try:
        # EventBridge sends the 'Input' from put_targets directly as the event body
        detail = event # The entire event is the payload we sent

        bike_id = detail.get('bikeId')
        booking_ref_code = detail.get('bookingReferenceCode')
        new_bike_status = detail.get('newBikeStatus')
        new_booking_status = detail.get('newBookingStatus')
        action = detail.get('action') # 'start_booking' or 'end_booking'
        cleanup_rules = detail.get('cleanupRules', []) # Rules to delete (only sent for 'end_booking')

        if not all([bike_id, booking_ref_code, new_bike_status, new_booking_status, action]):
            print(f"ERROR: Missing required data in scheduled event: {detail}. Skipping.")
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Missing required data in scheduled event.'})
            }

        print(f"Processing scheduled update for booking {booking_ref_code}: Set bike {bike_id} to '{new_bike_status}', booking to '{new_booking_status}'.")

        # 1. Update Bike Status
        try:
            bikes_table.update_item(
                Key={'bikeId': bike_id},
                UpdateExpression="SET #s = :status",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":status": new_bike_status}
            )
            print(f"Bike {bike_id} status updated to '{new_bike_status}'.")
        except ClientError as e:
            print(f"ERROR: DynamoDB Client Error updating bike status for {bike_id}: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            print(traceback.format_exc())
            # Re-raise to trigger retry for this message
            raise

        # 2. Update Booking Status
        try:
            bookings_table.update_item(
                Key={'bookingReferenceCode': booking_ref_code},
                UpdateExpression="SET #s = :status, updatedAt = :timestamp",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":status": new_booking_status,
                    ":timestamp": datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
                }
            )
            print(f"Booking {booking_ref_code} status updated to '{new_booking_status}'.")
        except ClientError as e:
            print(f"ERROR: DynamoDB Client Error updating booking status for {booking_ref_code}: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            print(traceback.format_exc())
            raise # Re-raise to trigger retry

        # 3. Clean up EventBridge rules if this is the 'end_booking' event
        if action == 'end_booking' and cleanup_rules:
            for rule_name in cleanup_rules:
                try:
                    # Remove targets first
                    events_client.remove_targets(
                        Rule=rule_name,
                        Ids=['1'] # The ID we used when creating the target
                    )
                    # Then delete the rule
                    events_client.delete_rule(Name=rule_name)
                    print(f"Cleaned up EventBridge rule: {rule_name}")
                except ClientError as e:
                    # Log but don't re-raise, as rule cleanup is secondary to status update
                    print(f"WARNING: EventBridge Client Error cleaning up rule {rule_name}: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
                    print(traceback.format_exc())
                except Exception as e:
                    print(f"WARNING: Unexpected error cleaning up rule {rule_name}: {e}")
                    print(traceback.format_exc())

    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in update_bike_status_on_schedule: {e}")
        print(traceback.format_exc())
        raise # Re-raise for retry

    print(f"END RequestId: {context.aws_request_id}")
    return {
        'statusCode': 200,
        'body': json.dumps('Scheduled bike status update processed.')
    }