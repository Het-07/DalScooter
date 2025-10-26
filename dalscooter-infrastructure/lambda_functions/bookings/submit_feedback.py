import json
import boto3
import os
import uuid
from datetime import datetime, timezone # Import timezone
from decimal import Decimal
from botocore.exceptions import ClientError # Import ClientError for specific AWS errors
import traceback # Import traceback for detailed error logging

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
    feedback_table_name = os.environ.get('FEEDBACK_TABLE_NAME', 'DALScooterFeedback')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooterBikes') # Get bikes table name

    if not feedback_table_name or not bikes_table_name:
        print("ERROR: Environment variables FEEDBACK_TABLE_NAME or BIKES_TABLE_NAME not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: Table names not set.'})
        }
    
    feedback_table = dynamodb.Table(feedback_table_name)
    bikes_table = dynamodb.Table(bikes_table_name) # Initialize bikes table

    try:
        body = json.loads(event.get('body', '{}'))
        
        customer_id = event['requestContext']['authorizer']['claims']['sub']
        bike_id = body.get('bikeId')
        rating = body.get('rating')
        comment = body.get('comment')

        if not all([bike_id, rating, comment is not None]):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing required fields: bikeId, rating, comment'})
            }
        
        if not (1 <= rating <= 5):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Rating must be between 1 and 5.'})
            }

        try:
            bike_response = bikes_table.get_item(Key={'bikeId': bike_id})
            bike = bike_response.get('Item')

            if not bike:
                print(f"ERROR: Bike with ID {bike_id} not found for feedback submission.")
                return {
                    'statusCode': 404,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': f'Bike with ID {bike_id} not found. Cannot submit feedback.'})
                }
        except ClientError as e:
            print(f"ERROR: DynamoDB Client Error checking bike existence: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            print(traceback.format_exc())
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'Error checking bike existence: {e.response["Error"]["Message"]}'})
            }

        feedback_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z') # Use timezone.utc

        item = {
            'feedbackId': feedback_id,
            'userId': customer_id,
            'bikeId': bike_id,
            'rating': Decimal(str(rating)), # Store rating as Decimal for precision
            'comment': comment,
            'timestamp': timestamp,
            'sentiment': 'PENDING_ANALYSIS' # Placeholder, to be updated by an NLP service later
        }

        feedback_table.put_item(Item=item)

        print(f"Feedback submitted: {feedback_id} by user {customer_id} for bike {bike_id}")

        return {
            'statusCode': 201, # 201 Created
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Feedback submitted successfully.',
                'feedbackId': feedback_id
            }, cls=DecimalEncoder) # Use DecimalEncoder for proper JSON serialization
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
        print(f"ERROR: Missing expected key in event or context: {e}")
        print(traceback.format_exc()) # Print full traceback
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Missing data in request or context: {str(e)}'})
        }
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in submit_feedback: {e}")
        print(traceback.format_exc()) # Print full traceback
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }