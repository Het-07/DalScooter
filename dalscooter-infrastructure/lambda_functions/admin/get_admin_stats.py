import json
import boto3
import os
from datetime import datetime, timedelta, timezone # Import timezone
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import traceback # Import traceback

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
    print(f"START RequestId: {context.aws_request_id} Version: {context.function_version}")
    print(f"Incoming event: {json.dumps(event)}")

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
    
    users_table_name = os.environ.get('USERS_TABLE_NAME', 'DALScooterUserAuth')
    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME', 'DALScooter_Bookings')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooter_Bikes')
    feedback_table_name = os.environ.get('FEEDBACK_TABLE_NAME', 'DALScooterFeedback') # Get Feedback table name

    if not users_table_name or not bookings_table_name or not bikes_table_name or not feedback_table_name:
        print("ERROR: One or more environment variables for tables not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: DynamoDB table names not set.'})
        }

    users_table = dynamodb.Table(users_table_name)
    bookings_table = dynamodb.Table(bookings_table_name)
    bikes_table = dynamodb.Table(bikes_table_name)
    feedback_table = dynamodb.Table(feedback_table_name)

    stats = {}

    try:
        # 1. Get Total Users
        print("Fetching total users...")
        users_response = users_table.scan(Select='COUNT')
        stats['totalUsers'] = users_response.get('Count', 0)
        print(f"Total users: {stats['totalUsers']}")

        # 2. Get Total Bikes and Bikes by Status
        print("Fetching total bikes and bikes by status...")
        bikes_response = bikes_table.scan(Select='COUNT')
        stats['totalBikes'] = bikes_response.get('Count', 0)
        print(f"Total bikes: {stats['totalBikes']}")

        # Counts for specific bike statuses
        bike_statuses = ['available', 'in-use', 'pending', 'in-maintenance']
        stats['bikesByStatus'] = {}
        for status in bike_statuses:
            status_response = bikes_table.scan(
                FilterExpression=Attr('status').eq(status),
                Select='COUNT'
            )
            stats['bikesByStatus'][status] = status_response.get('Count', 0)
            print(f"Bikes with status '{status}': {stats['bikesByStatus'][status]}")

        stats['availableBikesCount'] = stats['bikesByStatus'].get('available', 0) # Keep for direct access
        stats['inUseBikesCount'] = stats['bikesByStatus'].get('in-use', 0) # Keep for direct access

        # 3. Get Total Bookings and Bookings by Status
        print("Fetching total bookings and bookings by status...")
        bookings_response = bookings_table.scan(Select='COUNT')
        stats['totalBookings'] = bookings_response.get('Count', 0)
        print(f"Total bookings: {stats['totalBookings']}")

        # Counts for specific booking statuses
        booking_statuses = ['pending_approval', 'approved', 'active', 'completed', 'cancelled', 'rejected']
        stats['bookingsByStatus'] = {}
        for status in booking_statuses:
            status_response = bookings_table.scan(
                FilterExpression=Attr('status').eq(status),
                Select='COUNT'
            )
            stats['bookingsByStatus'][status] = status_response.get('Count', 0)
            print(f"Bookings with status '{status}': {stats['bookingsByStatus'][status]}")

        stats['activeBookingsCount'] = stats['bookingsByStatus'].get('active', 0) # Keep for direct access

        # 4. Get Total Feedback Entries
        print("Fetching total feedback entries...")
        feedback_response = feedback_table.scan(Select='COUNT')
        stats['totalFeedbackEntries'] = feedback_response.get('Count', 0)
        print(f"Total feedback entries: {stats['totalFeedbackEntries']}")

        # 5. Get Login Statistics (STILL PLACEHOLDER - requires architectural changes for real data)
        print("Generating dummy login statistics (placeholder)...")
        # login_statistics = []
        # today = datetime.now(timezone.utc).date() # Use timezone-aware date
        # for i in range(7): # For the last 7 days
        #     date = today - timedelta(days=i)
        #     dummy_logins = (i + 1) * 10 + (i % 3) * 5 # Just some varied numbers for demonstration
        #     login_statistics.append({
        #         "date": date.isoformat(),
        #         "logins": dummy_logins
        #     })
        # login_statistics.reverse() # Sort to show oldest first
        # stats['loginStatistics'] = login_statistics
        # print(f"Dummy login statistics generated: {stats['loginStatistics']}")

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Admin statistics retrieved successfully',
                'statistics': stats
            }, cls=DecimalEncoder)
        }

    except ClientError as e:
        print(f"ERROR: DynamoDB Client Error getting admin stats: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
        print(traceback.format_exc()) # Print full traceback
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Error retrieving admin statistics from DynamoDB: {e.response["Error"]["Message"]}'})
        }
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in get_admin_stats: {e}") # Removed exc_info=True
        print(traceback.format_exc()) # Print full traceback
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }