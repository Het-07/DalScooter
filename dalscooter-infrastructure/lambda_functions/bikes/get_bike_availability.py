import json
import boto3
import os
from boto3.dynamodb.conditions import Key, Attr

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    bikes_table_name = os.environ.get('BIKES_TABLE_NAME')
    bookings_table_name = os.environ.get('BOOKINGS_TABLE_NAME')
    
    if not bikes_table_name or not bookings_table_name:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Environment variables BIKES_TABLE_NAME or BOOKINGS_TABLE_NAME not set'})
        }
    
    bikes_table = dynamodb.Table(bikes_table_name)

    try:
        query_params = event.get('queryStringParameters', {})
        location_filter = None
        if query_params is not None:
            print(f"Query parameters: {query_params}")
            location_filter = query_params.get('location')

        # Find all bikes with status 'available'
        if location_filter:
            # Use GSI for efficient query by location and status
            print("Location filter provided, using GSI.")
            response = bikes_table.query(
                IndexName='LocationStatusIndex',
                KeyConditionExpression=Key('location').eq(location_filter) & Key('status').eq('available')
            )
        else:
            # Fallback to scan if no location filter, or if GSI is not optimal for this use case
            # Note: Scan is inefficient for large tables. Consider GSI based on common query patterns.
            print("No location filter provided, scanning all bikes.")
            response = bikes_table.scan(
                FilterExpression=Attr('status').eq('available')
            )
        
        print(response)
        available_bikes = response.get('Items', [])

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Available bikes retrieved successfully',
                'bikes': available_bikes
            }, default=str) # default=str handles Decimal types from DynamoDB
        }
    except Exception as e:
        print(f"Error getting bike availability: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Could not retrieve bike availability: {str(e)}'})
        }