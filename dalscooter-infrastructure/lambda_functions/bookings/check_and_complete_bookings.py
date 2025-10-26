import json
import boto3
import os
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Attr
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
    print(f"Incoming EventBridge scheduled event: {json.dumps(event)}")

    dynamodb = boto3.resource('dynamodb')
    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooter_Bookings')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooter_Bikes')

    if not bookings_table_name or not bikes_table_name:
        print("ERROR: Environment variables for tables not set.")
        raise ValueError('Configuration error: DynamoDB table names not set.')

    bookings_table = dynamodb.Table(bookings_table_name)
    bikes_table = dynamodb.Table(bikes_table_name)

    current_utc_time_str = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    print(f"Checking for bookings ending before: {current_utc_time_str}")

    try:
        # Scan for bookings that are 'approved' or 'active' and whose endTime is in the past
        # Note: Scan is inefficient for large tables. For production, consider a GSI on status and endTime.
        response = bookings_table.scan(
            FilterExpression=Attr('status').is_in(['approved', 'active']) & Attr('endTime').lt(current_utc_time_str)
        )
        expired_bookings = response.get('Items', [])
        print(f"Found {len(expired_bookings)} expired bookings to process.")

        for booking in expired_bookings:
            booking_ref_code = booking.get('bookingReferenceCode')
            bike_id = booking.get('bikeId')
            booking_status = booking.get('status')

            print(f"Processing expired booking: {booking_ref_code} (Bike: {bike_id}, Status: {booking_status})")

            try:
                # Update booking status to 'completed'
                bookings_table.update_item(
                    Key={'bookingReferenceCode': booking_ref_code},
                    UpdateExpression="SET #s = :status, completedAt = :timestamp",
                    ExpressionAttributeNames={"#s": "status"},
                    ExpressionAttributeValues={
                        ":status": "completed",
                        ":timestamp": current_utc_time_str
                    }
                )
                print(f"Booking {booking_ref_code} status set to 'completed'.")

                # Update bike status to 'available' (if it was 'in-use' or 'pending')
                # This acts as a fallback if the end-time EventBridge rule failed.
                bikes_table.update_item(
                    Key={'bikeId': bike_id},
                    UpdateExpression="SET #s = :status",
                    ExpressionAttributeNames={"#s": "status"},
                    ExpressionAttributeValues={":status": "available"}
                )
                print(f"Bike {bike_id} status set to 'available'.")

            except ClientError as e:
                print(f"ERROR: DynamoDB Client Error processing expired booking {booking_ref_code}: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
                print(traceback.format_exc())
                # Do not re-raise here; allow processing of other messages.
            except Exception as e:
                print(f"ERROR: Unexpected error processing expired booking {booking_ref_code}: {e}")
                print(traceback.format_exc())
                # Do not re-raise here.

    except ClientError as e:
        print(f"CRITICAL ERROR: DynamoDB Client Error scanning for expired bookings: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
        print(traceback.format_exc())
        raise # Re-raise to signal EventBridge to retry the scheduled invocation
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in check_and_complete_bookings: {e}")
        print(traceback.format_exc())
        raise # Re-raise for retry

    print(f"END RequestId: {context.aws_request_id}")
    return {
        'statusCode': 200,
        'body': json.dumps('Expired bookings check completed.')
    }