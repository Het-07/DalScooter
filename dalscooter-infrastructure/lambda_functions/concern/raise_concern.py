import boto3
import random
import os
import json
from datetime import datetime

#DynamoDB to audit
dynamodb = boto3.resource('dynamodb')
#Cognito to get Franchise operatores. 
cognito = boto3.client('cognito-idp')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        booking_id = body.get("bookingId")
        concern = body.get("concern")

        if not booking_id or not concern:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Missing bookingId or concern'}),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            }

        # Get random franchise user
        user_pool_id = os.environ["USER_POOL_ID"]
        admin_user_group = os.environ["FRANCHISE_USER_GROUP_NAME"]
        random_franchise_user = get_random_franchise_user(user_pool_id, admin_user_group)
        assigned_to = random_franchise_user['Username']

        # Log to DynamoDB
        table = dynamodb.Table("CustomerConcerns")
        table.put_item(
            Item={
                'bookingId': booking_id,
                'timestamp': datetime.utcnow().isoformat(),
                'concern': concern,
                'status': "OPEN",
                'assigned_to': assigned_to
            }
        )

        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Concern submitted successfully'}),
            'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
        }

    except Exception as e:
        print(f"Error occurred during lambda execution: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal server error'}),
            'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
        }

def get_random_franchise_user(user_pool_id, group_name):
    users = []
    next_token = None

    while True:
        kwargs = {
            'UserPoolId': user_pool_id,
            'GroupName': group_name,
            'Limit': 60
        }
        if next_token:
            kwargs['NextToken'] = next_token

        response = cognito.list_users_in_group(**kwargs)
        users.extend(response['Users'])

        next_token = response.get('NextToken')
        if not next_token:
            break

    if not users:
        raise Exception("No users found in the group.")
    return random.choice(users)
