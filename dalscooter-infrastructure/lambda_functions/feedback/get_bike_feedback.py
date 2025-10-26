import json
import boto3
import os
from decimal import Decimal
from botocore.exceptions import ClientError
import traceback
from boto3.dynamodb.conditions import Key # Import Key for KeyConditionExpression

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
    cognito_client = boto3.client('cognito-idp')

    feedback_table_name = os.environ.get('FEEDBACK_TABLE_NAME', 'DALScooter_Feedback')
    user_pool_id = os.environ.get('USER_POOL_ID')

    if not feedback_table_name:
        print("ERROR: Environment variable FEEDBACK_TABLE_NAME not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: Feedback table name not set.'})
        }

    if not user_pool_id:
        print("ERROR: Environment variable USER_POOL_ID not set.")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Configuration error: User Pool ID not set.'})
        }

    feedback_table = dynamodb.Table(feedback_table_name)

    bike_id = event.get('pathParameters', {}).get('bike_id')

    if not bike_id:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Missing bike_id in path parameters.'})
        }

    try:
        response = feedback_table.query(
            IndexName='BikeIdIndex', # Assuming your GSI on bikeId is named 'BikeIdIndex'
            KeyConditionExpression=Key('bikeId').eq(bike_id)
        )
        feedback_items = response.get('Items', [])

        sentiment_counts = {
            'positive': 0,
            'negative': 0,
            'neutral': 0
        }

        # Fetch user names/emails and aggregate sentiments
        for item in feedback_items:
            user_id = item.get('userId')
            display_name = 'Anonymous' # Default display name

            if user_id:
                try:
                    user_response = cognito_client.admin_get_user(
                        UserPoolId=user_pool_id,
                        Username=user_id # In Cognito, 'sub' (userId) is the Username for AdminGetUser
                    )

                    # Extract 'name' attribute
                    user_name_attr = next(
                        (attr['Value'] for attr in user_response['UserAttributes'] if attr['Name'] == 'name'),
                        None
                    )
                    # Extract 'email' attribute (which is the Cognito username)
                    user_email_attr = next(
                        (attr['Value'] for attr in user_response['UserAttributes'] if attr['Name'] == 'email'),
                        None
                    )

                    if user_name_attr:
                        display_name = user_name_attr
                    elif user_email_attr: # Fallback to email if name is not available
                        display_name = user_email_attr
                    else:
                        display_name = 'Unknown User' # Fallback if neither name nor email found

                except ClientError as e:
                    if e.response['Error']['Code'] == 'UserNotFoundException':
                        display_name = 'Deleted User'
                    else:
                        print(f"Error fetching user details for {user_id}: {e}")
                        display_name = 'Error Fetching Name'

            item['userName'] = display_name # Store the determined display name

            # Aggregate sentiment
            sentiment = item.get('sentiment')
            if sentiment in sentiment_counts:
                sentiment_counts[sentiment] += 1
            elif sentiment:
                print(f"Warning: Unknown sentiment '{sentiment}' found for feedback {item.get('feedbackId')}")

        most_popular_sentiment = None
        max_count = -1

        sorted_sentiments = sorted(sentiment_counts.items(), key=lambda item: item[1], reverse=True)

        if sorted_sentiments:
            most_popular_sentiment = sorted_sentiments[0][0]
            max_count = sorted_sentiments[0][1]

            if max_count == 0:
                most_popular_sentiment = None

        print(f"Found {len(feedback_items)} feedback entries for bike {bike_id}.")
        print(f"Sentiment counts: {sentiment_counts}")
        print(f"Most popular sentiment: {most_popular_sentiment} (Count: {max_count})")

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Feedback retrieved successfully.',
                'feedback': feedback_items,
                'sentimentSummary': sentiment_counts,
                'mostPopularSentiment': most_popular_sentiment
            }, cls=DecimalEncoder)
        }

    except ClientError as e:
        print(f"ERROR: DynamoDB Client Error retrieving feedback: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Error retrieving feedback: {e.response["Error"]["Message"]}'})
        }
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in get_bike_feedback: {e}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'An unexpected error occurred: {str(e)}'})
        }