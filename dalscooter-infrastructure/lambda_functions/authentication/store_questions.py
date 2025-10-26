# StoreQuestions Lambda
# Stores question-answer pairs in DynamoDB during registration

import json
import boto3
import hashlib
import os

dynamodb = boto3.client('dynamodb')

def lambda_handler(event, context):
    username = event['userName']
    user_attributes = event['request']['userAttributes']
    questions = json.loads(event['request'].get('clientMetadata', {}).get('questions', '[]'))
    
    if len(questions) != 3:
        raise Exception("Exactly three questions are required")
    
    item = {
        'username': {'S': username},
        'userType': {'S': user_attributes.get('userType', 'Customer')},
        'name': {'S': user_attributes['name']},
        'questions': {'L': [
            {'M': {'question': {'S': q['question']}, 'answerHash': {'S': hashlib.sha256(q['answer'].encode()).hexdigest()}}}
            for q in questions
        ]}
    }
    dynamodb.put_item(TableName=os.environ['DDB_TABLE'], Item=item)
    return event