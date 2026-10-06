import json
import os
from datetime import datetime, timezone
import psycopg
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")
with open("payments.json", "r", encoding="utf-8") as f:
    payments = json.load(f)
def parse_timestamp(value):
    if not value:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(
            value / 1000,
            tz=timezone.utc
        )
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None
        try:
            return datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )
        except ValueError:
            return None
    return None
def first_value(data, *keys, default=None):
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return default
print("===== PAYMENTS MIGRATION =====")
print(f"PAYMENTS FOUND IN JSON: {len(payments)}")
conn = psycopg.connect(DATABASE_URL)
try:
    with conn.cursor() as cur:
        # ---------------------------------------------------------
        # Prevent duplicate migration
        # ---------------------------------------------------------
        cur.execute("SELECT COUNT(*) FROM payments")
        existing_count = cur.fetchone()[0]
        print(
            f"EXISTING PAYMENTS IN DATABASE: "
            f"{existing_count}"
        )
        if existing_count > 0:
            raise RuntimeError(
                "Payments already exist in the database. "
                "Migration stopped to prevent duplication."
            )
        migrated = 0
        linked_events = 0
        linked_bookings = 0
        missing_events = 0
        missing_bookings = 0
        linked_users = 0
        # ---------------------------------------------------------
        # Migrate every legacy payment
        # ---------------------------------------------------------
        for payment in payments:
            legacy_payment_id = payment.get("id")
            legacy_event_id = payment.get("eventId")
            legacy_booking_id = payment.get("bookingId")
            legacy_user_id = payment.get("userId")
            # -----------------------------------------------------
            # Find matching event
            # -----------------------------------------------------
            database_event_id = None
            if legacy_event_id is not None:
                cur.execute(
                    """
                    SELECT id
                    FROM events
                    WHERE id = %s
                    """,
                    (legacy_event_id,)
                )
                event_row = cur.fetchone()
                if event_row:
                    database_event_id = event_row[0]
                    linked_events += 1
                else:
                    missing_events += 1
                    print(
                        f"EVENT NOT FOUND FOR PAYMENT "
                        f"{legacy_payment_id}: "
                        f"{legacy_event_id}"
                    )
            # -----------------------------------------------------
            # Find matching booking
            # -----------------------------------------------------
            database_booking_id = None
            if legacy_booking_id is not None:
                cur.execute(
                    """
                    SELECT id
                    FROM bookings
                    WHERE id = %s
                    """,
                    (legacy_booking_id,)
                )
                booking_row = cur.fetchone()
                if booking_row:
                    database_booking_id = booking_row[0]
                    linked_bookings += 1
                else:
                    missing_bookings += 1
                    print(
                        f"BOOKING NOT FOUND FOR PAYMENT "
                        f"{legacy_payment_id}: "
                        f"{legacy_booking_id}"
                    )
            # -----------------------------------------------------
            # Find matching user
            # -----------------------------------------------------
            owner_user_id = None
            if legacy_user_id is not None:
                cur.execute(
                    """
                    SELECT id
                    FROM users
                    WHERE id = %s
                    """,
                    (legacy_user_id,)
                )
                user_row = cur.fetchone()
                if user_row:
                    owner_user_id = user_row[0]
                    linked_users += 1
            # -----------------------------------------------------
            # Some legacy payment records may not contain userId.
            # If email exists, try matching by email.
            # -----------------------------------------------------
            if owner_user_id is None:
                buyer_email = first_value(
                    payment,
                    "customerEmail",
                    "buyerEmail",
                    "email"
                )
                if buyer_email:
                    cur.execute(
                        """
                        SELECT id
                        FROM users
                        WHERE LOWER(email) = LOWER(%s)
                        LIMIT 1
                        """,
                        (buyer_email,)
                    )
                    user_row = cur.fetchone()
                    if user_row:
                        owner_user_id = user_row[0]
                        linked_users += 1
            # -----------------------------------------------------
            # Payment values
            # -----------------------------------------------------
            quantity = first_value(
                payment,
                "quantity",
                default=1
            )
            amount = first_value(
                payment,
                "amount",
                "paidAmount",
                default=0
            )
            paid_amount = first_value(
                payment,
                "paidAmount",
                "amount",
                default=amount
            )
            ticket_price = first_value(
                payment,
                "ticketPrice",
                "ticket_price",
                default=None
            )
            subtotal = first_value(
                payment,
                "subtotal",
                default=None
            )
            service_fee = first_value(
                payment,
                "serviceFee",
                "service_fee",
                default=None
            )
            service_fee_percent = first_value(
                payment,
                "serviceFeePercent",
                "service_fee_percent",
                default=None
            )
            # -----------------------------------------------------
            # If subtotal is absent but amount exists, preserve the
            # total amount rather than inventing a subtotal.
            # -----------------------------------------------------
            if subtotal is None:
                subtotal = None
            # -----------------------------------------------------
            # Buyer information
            # -----------------------------------------------------
            buyer_name = first_value(
                payment,
                "customerName",
                "buyerName",
                "name"
            )
            buyer_email = first_value(
                payment,
                "customerEmail",
                "buyerEmail",
                "email"
            )
            phone_number = first_value(
                payment,
                "phoneNumber",
                "phone",
                "customerPhone"
            )
            # -----------------------------------------------------
            # Provider/payment information
            # -----------------------------------------------------
            provider = first_value(
                payment,
                "provider",
                default="flutterwave"
            )
            tx_ref = first_value(
                payment,
                "txRef",
                "tx_ref"
            )
            transaction_id = first_value(
                payment,
                "transactionId",
                "transaction_id"
            )
            status = first_value(
                payment,
                "status",
                default="unknown"
            )
            processed = bool(
                first_value(
                    payment,
                    "processed",
                    default=status in (
                        "successful",
                        "success",
                        "completed",
                        "paid",
                        "processed"
                    )
                )
            )
            currency = first_value(
                payment,
                "currency",
                default="UGX"
            )
            # -----------------------------------------------------
            # Preserve the complete original payment record.
            #
            # payments.provider_response is JSONB, so this allows
            # us to retain every legacy field without inventing
            # additional database columns.
            # -----------------------------------------------------
            provider_response = payment
            # -----------------------------------------------------
            # Insert payment
            # -----------------------------------------------------
            cur.execute(
                """
                INSERT INTO payments (
                    provider,
                    tx_ref,
                    transaction_id,
                    pesapal_order_tracking_id,
                    pesapal_merchant_reference,
                    event_id,
                    owner_user_id,
                    ticket_type_id,
                    quantity,
                    buyer_name,
                    buyer_email,
                    phone_number,
                    ticket_price,
                    subtotal,
                    service_fee,
                    service_fee_percent,
                    amount,
                    currency,
                    status,
                    paid_amount,
                    processed,
                    booking_id,
                    provider_response,
                    processed_at,
                    created_at,
                    updated_at
                )
                VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s
                )
                RETURNING id
                """,
                (
                    provider,
                    tx_ref,
                    transaction_id,
                    first_value(
                        payment,
                        "pesapalOrderTrackingId"
                    ),
                    first_value(
                        payment,
                        "pesapalMerchantReference"
                    ),
                    database_event_id,
                    owner_user_id,
                    first_value(
                        payment,
                        "ticketTypeId",
                        "ticket_type_id"
                    ),
                    quantity,
                    buyer_name,
                    buyer_email,
                    phone_number,
                    ticket_price,
                    subtotal,
                    service_fee,
                    service_fee_percent,
                    amount,
                    currency,
                    status,
                    paid_amount,
                    processed,
                    database_booking_id,
                    json.dumps(provider_response),
                    parse_timestamp(
                        payment.get("processedAt")
                    ),
                    parse_timestamp(
                        payment.get("createdAt")
                    ),
                    parse_timestamp(
                        payment.get("updatedAt")
                        or payment.get("createdAt")
                    )
                )
            )
            new_payment_id = cur.fetchone()[0]
            print(
                f"MIGRATED PAYMENT: "
                f"{new_payment_id} "
                f"(legacy {legacy_payment_id})"
            )
            migrated += 1
        conn.commit()
        print("")
        print("PAYMENTS MIGRATION SUCCESSFUL")
        print(f"MIGRATED PAYMENTS: {migrated}")
        print(f"USERS LINKED: {linked_users}")
        print(f"EVENTS LINKED: {linked_events}")
        print(f"BOOKINGS LINKED: {linked_bookings}")
        print(f"MISSING EVENTS: {missing_events}")
        print(f"MISSING BOOKINGS: {missing_bookings}")
finally:
    conn.close()