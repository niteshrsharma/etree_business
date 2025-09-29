from azure.communication.email import EmailClient
import asyncio
from backend.config import settings 

client = EmailClient.from_connection_string(settings.AZURE_COMMUNICATION_CONNECTION_STRING)
sender_address = settings.AZURE_COMMUNICATION_SENDER

async def send_email_async(to_address: str, subject: str, plain_text: str, html_content: str = None):
    content = {
        "subject": subject,
        "plainText": plain_text,
    }
    if html_content:
        content["html"] = html_content

    message = {
        "senderAddress": sender_address,
        "recipients": {
            "to": [{"address": to_address}]
        },
        "content": content,
    }

    try:
        def send():
            poller = client.begin_send(message)
            result = poller.result()
            return result.get("messageId") or "no-message-Id"

        message_id = await asyncio.to_thread(send)
        print(message_id)
        return {"message": "Email sent", "message_id": message_id}

    except Exception as ex:
        print(ex)
        return {"error": str(ex)}

