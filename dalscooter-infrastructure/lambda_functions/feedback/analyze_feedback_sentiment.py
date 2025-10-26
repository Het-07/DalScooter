import os
import boto3
import json
from datetime import datetime, timedelta

DYNAMODB_TABLE = os.environ.get('FEEDBACK_TABLE_NAME', 'DALScooterFeedback')

def map_sentiment(sentiment):
    if sentiment == "POSITIVE":
        return "positive"
    elif sentiment == "NEUTRAL":
        return "neutral"
    else:
        return "negative"

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    comprehend = boto3.client('comprehend')
    table = dynamodb.Table(DYNAMODB_TABLE)

    # Get feedback from the last hour with pending_analysis
    one_hour_ago = datetime.utcnow() - timedelta(hours=1) # Change to minutes=1 for testing
    timestamp_str = one_hour_ago.strftime('%Y-%m-%dT%H:%M:%SZ')
    feedback_items = []
    last_evaluated_key = None

    while True:
        scan_kwargs = {
            'FilterExpression': 'sentiment = :pending',
            'ExpressionAttributeValues': {
                ':pending': "PENDING_ANALYSIS"
            }
        }
        if last_evaluated_key:
            scan_kwargs['ExclusiveStartKey'] = last_evaluated_key
        response = table.scan(**scan_kwargs)
        feedback_items.extend(response.get('Items', []))
        last_evaluated_key = response.get('LastEvaluatedKey')
        if not last_evaluated_key:
            break

    updated_count = 0
    for item in feedback_items:
        feedback_id = item['feedbackId']
        comment = item.get('comment', '')
        if not comment:
            continue
        sentiment_response = comprehend.detect_sentiment(Text=comment, LanguageCode='en')
        sentiment = map_sentiment(sentiment_response['Sentiment'])
        table.update_item(
            Key={'feedbackId': feedback_id},
            UpdateExpression="SET sentiment = :s",
            ExpressionAttributeValues={':s': sentiment}
        )
        updated_count += 1
    return {"updated": updated_count}
