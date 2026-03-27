import json
import os
from datetime import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key


dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])

USER_ID = os.environ["USER_ID"]
ALLOWED_ORIGIN = os.environ["ALLOWED_ORIGIN"]


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Headers": "content-type",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        },
        "body": json.dumps(body)
    }


def decimal_to_python(obj):
    if isinstance(obj, list):
        return [decimal_to_python(item) for item in obj]
    if isinstance(obj, dict):
        return {key: decimal_to_python(value) for key, value in obj.items()}
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    return obj


def validate_int(name, value, minimum, maximum):
    if not isinstance(value, int):
        raise ValueError(f"{name} must be an integer")
    if value < minimum or value > maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}")


def handle_post(event):
    try:
        body = json.loads(event.get("body", "{}"))

        entry_date = body.get("entryDate")
        sleep_hours = body.get("sleepHours")
        sleep_quality = body.get("sleepQuality")
        sensory_load = body.get("sensoryLoad")
        masking_level = body.get("maskingLevel")
        nightmare_intensity = body.get("nightmareIntensity")
        notes = body.get("notes", "").strip()

        if not entry_date:
            raise ValueError("entryDate is required")

        # Validate date format
        datetime.strptime(entry_date, "%Y-%m-%d")

        validate_int("sleepHours", sleep_hours, 0, 24)
        validate_int("sleepQuality", sleep_quality, 1, 10)
        validate_int("sensoryLoad", sensory_load, 1, 10)
        validate_int("maskingLevel", masking_level, 1, 10)
        validate_int("nightmareIntensity", nightmare_intensity, 0, 10)

        if len(notes) > 500:
            raise ValueError("notes must be 500 characters or fewer")

        timestamp = datetime.utcnow().isoformat()

        item = {
            "UserId": USER_ID,
            "EntryTimestamp": timestamp,
            "EntryDate": entry_date,
            "SleepHours": sleep_hours,
            "SleepQuality": sleep_quality,
            "SensoryLoad": sensory_load,
            "MaskingLevel": masking_level,
            "NightmareIntensity": nightmare_intensity,
            "Notes": notes
        }

        table.put_item(Item=item)

        return response(200, {
            "message": "Entry saved successfully",
            "item": item
        })

    except ValueError as exc:
        return response(400, {"error": str(exc)})
    except Exception as exc:
        return response(500, {"error": "Internal server error", "detail": str(exc)})


def handle_get():
    try:
        result = table.query(
            KeyConditionExpression=Key("UserId").eq(USER_ID),
            ScanIndexForward=False,
            Limit=100
        )

        items = decimal_to_python(result.get("Items", []))

        return response(200, {
            "count": len(items),
            "items": items
        })

    except Exception as exc:
        return response(500, {"error": "Internal server error", "detail": str(exc)})


def lambda_handler(event, context):
    route_key = event.get("routeKey", "")

    if route_key == "POST /entries":
        return handle_post(event)

    if route_key == "GET /entries":
        return handle_get()

    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return response(200, {"message": "ok"})

    return response(404, {"error": "Route not found"})