# PostAuthentication Lambda
# Triggers login notification

import json
import boto3
import os

sqs = boto3.client('sqs')
def lambda_handler(event, context):
    try:
        email = event['request']['userAttributes']['email']
        sqs.send_message(
            QueueUrl=os.environ['SQS_QUEUE_URL'],
            MessageBody=json.dumps({
                'to': email,
                'subject': 'Welcome to DineConnect!!',
                'body': 'You have successfully signed up.'
            })
        )
        return event
    except Exception as e:
        print(f"Error occured during post authentication: {str(e)}")
        return event