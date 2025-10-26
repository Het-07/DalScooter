import json
import boto3
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from botocore.exceptions import ClientError
import traceback

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
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME', 'DALScooter_Bikes')

    if not bikes_table_name:
        print("ERROR: Environment variable BIKES_TABLE_NAME not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: Table name not set.'})
        }
    
    bikes_table = dynamodb.Table(bikes_table_name)

    try:
        body = json.loads(event.get('body', '{}'))
        
        model = body.get('model')
        location = body.get('location')
        status = body.get('status', 'available')
        rate_per_hour = body.get('ratePerHour')
        description = body.get('description')
        details = body.get('details')

        if not all([model, location]):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing required fields: model, location'})
            }
        
        if rate_per_hour is not None:
            try:
                rate_per_hour = Decimal(str(rate_per_hour))
                if rate_per_hour <= 0:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'application/json'
                        },
                        'body': json.dumps({'message': 'ratePerHour must be a positive number.'})
                    }
            except Exception:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'Invalid format for ratePerHour. Must be a number.'})
                }

        bike_id = str(uuid.uuid4())
        current_time = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')

        item = {
            'bikeId': bike_id,
            'model': model,
            'location': location,
            'status': status,
            'createdAt': current_time,
            'lastUpdateDate': current_time
        }

        if rate_per_hour is not None:
            item['ratePerHour'] = rate_per_hour
        if description is not None:
            item['description'] = description
        if details is not None:
            if isinstance(details, dict):
                item['details'] = details
            else:
                print(f"WARNING: 'details' field is not a dictionary for bike {bike_id}. Storing as is or skipping.")
                item['details'] = details

        bikes_table.put_item(Item=item)

        print(f"Bike added: {bike_id}")

        return {
            'statusCode': 201,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Bike added successfully',
                'bikeId': bike_id,
                'model': model,
                'location': location,
                'status': status
            }, cls=DecimalEncoder)
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
        print(f"ERROR: Missing expected key in event or body: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Missing data in request or context: {str(e)}'})
        }
    except ClientError as e:
        print(f"ERROR: DynamoDB Client Error adding bike: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Error adding bike: {e.response["Error"]["Message"]}'})
        }
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in add_bike: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }