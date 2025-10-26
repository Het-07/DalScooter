import json
import boto3
import os
from botocore.exceptions import ClientError
from datetime import datetime, timezone
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
        path_parameters = event.get('pathParameters', {})
        bike_id = path_parameters.get('bike_id')

        if not bike_id:
            print("ERROR: bike_id is missing from path parameters.")
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing bike_id in path parameters'})
            }

        body = json.loads(event.get('body', '{}'))
        
        # Fields that can be updated
        model = body.get('model')
        location = body.get('location')
        status = body.get('status')
        rate_per_hour = body.get('ratePerHour')
        description = body.get('description')
        details = body.get('details')

        # Build UpdateExpression dynamically
        update_expression_parts = []
        expression_attribute_values = {}
        expression_attribute_names = {} # Initialize for reserved keywords like 'location', 'status'
        
        if model is not None:
            update_expression_parts.append("model = :model")
            expression_attribute_values[":model"] = model
        if location is not None:
            # 'location' is a reserved keyword, use an alias
            update_expression_parts.append("#loc_attr = :location")
            expression_attribute_names["#loc_attr"] = "location"
            expression_attribute_values[":location"] = location
        if status is not None:
            # 'status' is a reserved keyword, use an alias
            update_expression_parts.append("#stat_attr = :status")
            expression_attribute_names["#stat_attr"] = "status"
            expression_attribute_values[":status"] = status
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
                update_expression_parts.append("ratePerHour = :rph")
                expression_attribute_values[":rph"] = rate_per_hour
            except Exception:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'Invalid format for ratePerHour. Must be a number.'})
                }
        if description is not None:
            update_expression_parts.append("description = :desc")
            expression_attribute_values[":desc"] = description
        if details is not None:
            if isinstance(details, dict):
                update_expression_parts.append("details = :det") # Directly use 'details', no alias needed
                expression_attribute_values[":det"] = details
            else:
                print(f"WARNING: 'details' field is not a dictionary for bike {bike_id}. Skipping update for 'details'.")
                # If 'details' is not a dict, we don't add it to the update expression, which is correct.

        # Always update lastUpdateDate
        current_time = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
        update_expression_parts.append("lastUpdateDate = :lud")
        expression_attribute_values[":lud"] = current_time

        if not update_expression_parts:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'No valid fields provided for update.'})
            }

        update_expression = "SET " + ", ".join(update_expression_parts)

        try:
            response = bikes_table.update_item(
                Key={'bikeId': bike_id},
                UpdateExpression=update_expression,
                # Only pass ExpressionAttributeNames if aliases were used (i.e., if it's not empty)
                ExpressionAttributeNames=expression_attribute_names if expression_attribute_names else None,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="ALL_NEW"
            )
            updated_item = response.get('Attributes')

            print(f"Bike {bike_id} updated successfully.")

            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'message': 'Bike updated successfully',
                    'updatedBike': updated_item
                }, cls=DecimalEncoder)
            }
        except ClientError as e:
            if e.response['Error']['Code'] == 'ValidationException' and "The provided key element does not match the schema" in e.response['Error']['Message']:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'Bike not found or invalid bikeId.'})
                }
            print(f"ERROR: DynamoDB Client Error updating bike: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            print(traceback.format_exc())
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'Error updating bike: {e.response["Error"]["Message"]}'})
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
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in update_bike: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }