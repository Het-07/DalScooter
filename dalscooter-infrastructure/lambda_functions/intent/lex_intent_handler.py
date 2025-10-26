import json
import boto3
import os
from datetime import datetime
import random

# === ENVIRONMENT CONFIG ===
dynamodb = boto3.resource("dynamodb")
cognito = boto3.client("cognito-idp")

BOOKINGS_TABLE = os.environ.get("BOOKINGS_TABLE_NAME", "DALScooterBookings")
CONCERNS_TABLE = os.environ.get("CONCERNS_TABLE_NAME", "CustomerConcerns")
USER_POOL_ID = os.environ.get("USER_POOL_ID")
FRANCHISE_USER_GROUP_NAME = os.environ.get("FRANCHISE_USER_GROUP_NAME")

# === URL & NAVIGATION MAPPING ===

# Full page routing + instructions by keyword and role
NAVIGATION_MAP = [
    {
        "keywords": ["home", "homepage", "back to home"],
        "roles": {
            "all": {
                "url": "https://app.dalscooter.ca/",
                "message": "You can return to the homepage here:"
            }
        }
    },
    {
        "keywords": ["register", "sign up"],
        "roles": {
            "all": {
                "url": "https://app.dalscooter.ca/register",
                "message": "To register, visit the link below and provide your name, email, password, and answer 3 security questions:"
            }
        }
    },
    {
        "keywords": ["login", "log in"],
        "roles": {
            "all": {
                "url": "https://app.dalscooter.ca/login",
                "message": "You can log in here:"
            }
        }
    },
    {
        "keywords": ["booking", "reserve", "book a bike", "my bookings", "reservation"],
        "roles": {
            "guest": {
                "url": "https://app.dalscooter.ca/login",
                "message": "To book a bike, please log in here:"
            },
            "customer": {
                "url": "https://app.dalscooter.ca/customer/my-bookings",
                "message": "You can view and manage your bookings here:"
            },
            "franchise": {
                "url": "https://app.dalscooter.ca/admin/bookings/all",
                "message": "View all customer bookings here:"
            }
        }
    },
    {
        "keywords": ["feedback", "review"],
        "roles": {
            "all": {
                "url": "https://app.dalscooter.ca/feedback",
                "message": "You can submit or view feedback here:"
            }
        }
    },
    {
        "keywords": ["dashboard", "operator dashboard"],
        "roles": {
            "customer": {
                "url": "https://app.dalscooter.ca/dashboard",
                "message": "Your dashboard is available here:"
            },
            "franchise": {
                "url": "https://app.dalscooter.ca/dashboard",
                "message": "Franchise dashboard is here:"
            }
        }
    },
    {
        "keywords": ["bike management", "manage bikes", "list of bikes", "update rental", "discount code"],
        "roles": {
            "franchise": {
                "url": "https://app.dalscooter.ca/admin/bikes",
                "message": "Manage and edit bikes here:"
            }
        }
    },
    {
        "keywords": ["add bike"],
        "roles": {
            "franchise": {
                "url": "https://app.dalscooter.ca/admin/bikes/new",
                "message": "Add a new bike here:"
            }
        }
    },
    {
        "keywords": ["complaint", "concern", "message to franchise", "submit feedback"],
        "roles": {
            "all": {
                "url": "https://app.dalscooter.ca/complaints",
                "message": "You can raise a complaint or concern here:"
            }
        }
    },
    {
        "keywords": ["profile", "update profile"],
        "roles": {
            "all": {
                "url": "https://app.dalscooter.ca/dashboard",
                "message": "You can update your profile from your dashboard:"
            }
        }
    },
    {
        "keywords": ["faq", "help"],
        "roles": {
            "all": {
                "url": "https://app.dalscooter.ca/faq",
                "message": "Visit the FAQ section for common questions:"
            }
        }
    }
]

dynamodb = boto3.resource("dynamodb")
BOOKINGS_TABLE = os.environ.get("BOOKINGS_TABLE_NAME", "DALScooterBookings")

def lambda_handler(event, context):
    intent_name = event['sessionState']['intent']['name']
    input_text = event.get('inputTranscript', '').lower()

    session_attributes = event.get('sessionState', {}).get('sessionAttributes', {})
    user_role = session_attributes.get('userRole', 'guest').lower()

    print(f"[DEBUG] Intent: {intent_name} | Role: {user_role} | Input: {input_text}")
    print("==== DEBUG intent_name ====", intent_name)

    response_message = "I'm not sure where you'd like to go. Try keywords like booking, feedback, or dashboard."
    target_page = ""

    if intent_name == "NavigateIntent":
        response_message, target_page = handle_navigation(input_text, user_role)
    elif intent_name == "BookingStatusIntent":
        booking_code = event['sessionState']['intent']['slots'].get("bookingReferenceCode", {}).get("value", {}).get("interpretedValue")
        response_message = handle_booking_status(booking_code, user_role)


    elif intent_name == "BookingStatusIntent":
        booking_code = event['sessionState']['intent']['slots'].get("bookingReferenceCode", {}).get("value", {}).get("interpretedValue")
        response_message = handle_booking_status(booking_code, user_role)

    elif intent_name == "SubmitConcernIntent":
        booking_code = event['sessionState']['intent']['slots'].get("bookingCode", {}).get("value", {}).get("interpretedValue")
        concern_message = event['sessionState']['intent']['slots'].get("message", {}).get("value", {}).get("interpretedValue")
        response_message = handle_submit_concern(booking_code, concern_message, user_role)

    return {
        "sessionState": {
            "dialogAction": {
                "type": "Close"
            },
            "intent": {
                "name": intent_name,
                "state": "Fulfilled"
            },
            "sessionAttributes": {
                "targetPage": target_page,
                "userRole": user_role
            }
        },
        "messages": [
            {
                "contentType": "PlainText",
                "content": response_message
            }
        ]
    }

def handle_navigation(user_input, role):
    for entry in NAVIGATION_MAP:
        if any(keyword in user_input for keyword in entry["keywords"]):
            role_map = entry["roles"]
            if role in role_map:
                return f"{role_map[role]['message']}\n{role_map[role]['url']}", role_map[role]['url']
            elif "all" in role_map:
                return f"{role_map['all']['message']}\n{role_map['all']['url']}", role_map["all"]["url"]
    return "I couldn’t find the page you're asking about. Try asking for booking, feedback, or dashboard.", ""

def handle_booking_status(booking_code, role):
    if not booking_code:
        return "Please provide a valid booking reference code."

    try:
        table = dynamodb.Table(BOOKINGS_TABLE)
        response = table.get_item(Key={"bookingReferenceCode": booking_code})
        booking = response.get("Item")

        if not booking:
            return f"No booking found for code {booking_code}."

        # Duration calculation
        start, end = booking.get("startTime"), booking.get("endTime")
        duration = "unknown"
        if start and end:
            try:
                start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
                duration_hours = round((end_dt - start_dt).total_seconds() / 3600, 2)
                duration = f"{duration_hours} hours"
            except:
                pass

        if role == "customer":
            if booking.get("status") == "approved":
                return f"Your booking is approved. Access code: {booking.get('accessCode')}. Duration: {duration}."
            else:
                return f"Your booking status is {booking.get('status')}. Access code not available yet."

        elif role == "franchise":
            return f"Booking belongs to bike {booking.get('bikeId')}. Duration: {duration}. Status: {booking.get('status')}."

        else:
            return "Only registered users can check booking details. Please log in."

    except Exception as e:
        print(f"[ERROR] BookingStatusIntent failed: {str(e)}")
        return "There was an error retrieving your booking status. Please try again."

def handle_submit_concern(booking_code, concern_text, user_role):
    if user_role == "guest":
        return "Only registered users can submit a complaint. Please log in first."

    if not booking_code or not concern_text:
        return "Both booking reference code and concern message are required."

    try:
        lambda_client = boto3.client("lambda")
        payload = {
            "booking_code": booking_code,
            "concern": concern_text
        }

        response = lambda_client.invoke(
            FunctionName=os.environ.get("RAISE_CONCERN_LAMBDA_NAME"),
            InvocationType='RequestResponse',
            Payload=json.dumps({"body": json.dumps(payload)})
        )

        response_body = json.loads(response['Payload'].read())
        status_code = response_body.get('statusCode')
        message = json.loads(response_body.get('body', '{}')).get('message', '')

        if status_code == 200:
            return f"{message}"
        else:
            return f"Failed to submit your concern: {message}"

    except Exception as e:
        print(f"[ERROR] SubmitConcernIntent failed during Lambda invoke: {str(e)}")
        return "There was an error submitting your concern. Please try again."

def handle_booking_status(booking_code, role):
    if not booking_code:
        return "Please provide a valid booking reference code."

    try:
        table = dynamodb.Table(BOOKINGS_TABLE)
        response = table.get_item(Key={"bookingReferenceCode": booking_code})
        booking = response.get("Item")

        if not booking:
            return f"No booking found for code {booking_code}."

        # Calculate duration
        start, end = booking.get("startTime"), booking.get("endTime")
        duration = "unknown"
        if start and end:
            try:
                start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
                duration_hours = round((end_dt - start_dt).total_seconds() / 3600, 2)
                duration = f"{duration_hours} hours"
            except:
                pass

        if role == "customer":
            if booking.get("status") == "approved":
                return f"Your booking is approved. Access code: {booking.get('accessCode')}. Duration: {duration}."
            else:
                return f"Your booking status is {booking.get('status')}. Access code not available yet."

        elif role == "franchise":
            return f"Booking belongs to bike {booking.get('bikeId')}. Duration: {duration}. Status: {booking.get('status')}."

        else:
            return "Only registered users can check booking details. Please log in."

    except Exception as e:
        print(f"[ERROR] BookingStatusIntent failed: {str(e)}")
        return "There was an error retrieving your booking status. Please try again."