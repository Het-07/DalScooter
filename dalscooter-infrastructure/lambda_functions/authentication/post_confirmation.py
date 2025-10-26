# lambda/post_confirmation/index.py
import json
import boto3
import os
import hashlib

cognito = boto3.client('cognito-idp')
sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):

    try:
        username = event['userName']
        user_attributes = event['request']['userAttributes']
        user_type = user_attributes.get('custom:userType', 'Customer')
        user_pool_id = event['userPoolId']
        email = user_attributes.get('email', username)
        questions_json = user_attributes.get('custom:questions', '[]')

        # Parse security questions from custom:questions
        questions = json.loads(questions_json)
        hashed_questions = [
            {
                'question': q['question'],
                'answer': hashlib.sha256(q['answer'].encode()).hexdigest()
            }
            for q in questions
        ]

        # Store in DynamoDB with 'username' as partition key
        table = dynamodb.Table('DALScooterUserAuth')
        table.put_item(
            Item={
                'username': email,
                'userId': user_attributes['sub'],
                'userType': user_type,
                'questions': json.dumps(hashed_questions),
                'createdAt': event['request']['userAttributes'].get('email_verified', 'N/A')
            }
        )

        # Assign user to appropriate group
        group_name = 'AdminGroup' if user_type == 'Franchise' else 'CustomerGroup'
        cognito.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=username,
            GroupName=group_name
        )

        # Send registration notification to SQS
        sqs.send_message(
            QueueUrl=os.environ['SQS_QUEUE_URL'],
            MessageBody=json.dumps({
                'to': email,
                'subject': 'DineConnect - Login Successful!',
                'body': 'You have successfully logged in.'
            })
        )

        return event
    except Exception as e:
        print(f"Error in PostConfirmation: {str(e)}")
        return event