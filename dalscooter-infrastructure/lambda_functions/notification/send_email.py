import boto3
import json
import os

def lambda_handler(event, context):

    for record in event['Records']:
        body = record['body']

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            data = body

        print(f"Received message: {data}")

        sender_email = os.getenv("SENDER_EMAIL", "dalscooter@outlook.com")
        region = data.get("region","us-east-1")
        recipient_email = data.get("to", ["sv997262@dal.ca"])
        subject = data.get("subject", "DalScooter")
        body_text = data.get("body","")

        ses = boto3.client("ses", region_name=region)

        try:
            response = ses.send_email(
                Source=sender_email,
                Destination={"ToAddresses": [recipient_email]},
                Message={
                    "Subject": {"Data": subject},
                    "Body": {"Text": {"Data": body_text}}
                }
            )
            return {
                "statusCode": 200,
                "body": f"Email sent: {response['MessageId']}"
            }
        except Exception as e:
            return {
                "statusCode": 500,
                "body": f"SES failed: {str(e)}"
            }
