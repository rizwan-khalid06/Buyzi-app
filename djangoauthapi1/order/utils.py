from twilio.rest import Client
from django.conf import settings
from datetime import datetime

def send_order_confirmation_whatsapp(to_phone_number, order_id):
    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    except AttributeError as e:
        print(f"Twilio configuration error: Missing {str(e)} in settings at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return {"status": "failed", "error": f"Missing Twilio configuration: {str(e)}"}

    message_body = f"Thank you for your purchase! Your order (ID: {order_id}) has been successfully confirmed. We appreciate your business and look forward to serving you again. Happy shopping with Buyzi!"

    from_number = f'whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}'
    print(f"Sending WhatsApp message from: {from_number} to: {to_phone_number} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=f'whatsapp:{to_phone_number}'
        )
        print(f"WhatsApp message triggered. Message SID: {message.sid} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return {"status": "success", "message_sid": message.sid}
    except Exception as e:
        print(f"WhatsApp message failed: {str(e)} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return {"status": "failed", "error": str(e)}