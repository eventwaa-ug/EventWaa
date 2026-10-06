import json
import os
from datetime import datetime, timezone
import psycopg
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")
with open("bookings.json", "r", encoding="utf-8") as f:
    bookings = json.load(f)
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
print("===== BOOKINGS MIGRATION =====")
print(f"BOOKINGS FOUND IN JSON: {len(bookings)}")
conn = psycopg.connect(DATABASE_URL)
try:
    with conn.cursor() as cur:
        # ---------------------------------------------------------
        # Prevent duplicate migration
        # ---------------------------------------------------------
        cur.execute("SELECT COUNT(*) FROM bookings")
        existing_count = cur.fetchone()[0]
        print(
            f"EXISTING BOOKINGS IN DATABASE: "
            f"{existing_count}"
        )
        if existing_count > 0:
            raise RuntimeError(
                "Bookings already exist in the database. "
                "Migration stopped to prevent duplication."
            )
        migrated = 0
        linked_users = 0
        linked_events = 0
        linked_ticket_types = 0
        linked_payments = 0
        missing_users = 0
        missing_events = 0
        missing_ticket_types = 0
        missing_payments = 0
        for booking in bookings:
            legacy_booking_id = booking.get("id")
            legacy_user_id = first_value(
                booking,
                "userId",
                "user_id"
            )
            legacy_event_id = first_value(
                booking,
                "eventId",
                "event_id"
            )
            legacy_ticket_type_id = first_value(
                booking,
                "ticketTypeId",
                "ticket_type_id"
            )
            legacy_payment_id = first_value(
                booking,
                "paymentId",
                "payment_id"
            )
            # -----------------------------------------------------
            # USER
            #
            # Legacy bookings do not contain userId or buyer email.
            #
            # Resolve the owner through the already-migrated payment:
            #
            # Booking
            #   -> tx_ref
            #   -> payments
            #   -> provider_response.buyer.email
            #   -> users.email
            # -----------------------------------------------------
            database_user_id = None

            # First try legacy userId if one exists.
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
                    database_user_id = user_row[0]
                    linked_users += 1

            # -----------------------------------------------------
            # Fallback: resolve through migrated payment
            # -----------------------------------------------------
            if database_user_id is None:

                legacy_tx_ref = first_value(
                    booking,
                    "txRef",
                    "tx_ref"
                )

                if legacy_tx_ref:

                    cur.execute(
                        """
                        SELECT provider_response
                        FROM payments
                        WHERE tx_ref = %s
                        LIMIT 1
                        """,
                        (legacy_tx_ref,)
                    )

                    payment_row = cur.fetchone()

                    if payment_row:

                        provider_response = payment_row[0]

                        buyer = provider_response.get(
                            "buyer",
                            {}
                        )

                        buyer_email = buyer.get(
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
                                database_user_id = user_row[0]
                                linked_users += 1

            # -----------------------------------------------------
            # Final safety check
            # -----------------------------------------------------
            if database_user_id is None:

                missing_users += 1

                raise RuntimeError(
                    f"Could not resolve owner_user_id for "
                    f"legacy booking {legacy_booking_id}. "
                    f"Legacy userId={legacy_user_id}, "
                    f"txRef={first_value(booking, 'txRef', 'tx_ref')}"
                )
            # -----------------------------------------------------
            # EVENT
            # -----------------------------------------------------
            database_event_id = None
            if legacy_event_id is not None:
                cur.execute(
                    """
                    SELECT
                        id,
                        title,
                        date,
                        start_time,
                        venue,
                        city
                    FROM events
                    WHERE id = %s
                    """,
                    (legacy_event_id,)
                )
                event_row = cur.fetchone()
                if event_row:
                    database_event_id = event_row[0]
                    event_title_snapshot = event_row[1]
                    event_date_snapshot = event_row[2]
                    event_time_snapshot = event_row[3]
                    event_venue_snapshot = event_row[4]
                    event_city_snapshot = event_row[5]
                    linked_events += 1
                else:
                    missing_events += 1
                    print(
                        f"EVENT NOT FOUND FOR BOOKING "
                        f"{legacy_booking_id}: "
                        f"{legacy_event_id}"
                    )
                    event_title_snapshot = first_value(
                        booking,
                        "eventTitle",
                        "event_title"
                    )
                    event_date_snapshot = None
                    event_time_snapshot = first_value(
                        booking,
                        "eventTime",
                        "event_time"
                    )
                    event_venue_snapshot = first_value(
                        booking,
                        "eventVenue",
                        "venue"
                    )
                    event_city_snapshot = first_value(
                        booking,
                        "eventCity",
                        "city"
                    )
            else:
                event_title_snapshot = first_value(
                    booking,
                    "eventTitle",
                    "event_title"
                )
                event_date_snapshot = None
                event_time_snapshot = first_value(
                    booking,
                    "eventTime",
                    "event_time"
                )
                event_venue_snapshot = first_value(
                    booking,
                    "eventVenue",
                    "venue"
                )
                event_city_snapshot = first_value(
                    booking,
                    "eventCity",
                    "city"
                )
            # -----------------------------------------------------
            # TICKET TYPE
            # -----------------------------------------------------
            database_ticket_type_id = None
            ticket_type_snapshot = first_value(
                booking,
                "ticketTypeName",
                "ticketType",
                "ticket_type",
                default="Regular"
            )
            ticket_price = first_value(
                booking,
                "ticketPrice",
                "ticket_price",
                default=None
            )
            if legacy_ticket_type_id is not None:
                cur.execute(
                    """
                    SELECT
                        id,
                        name,
                        price
                    FROM event_ticket_types
                    WHERE id = %s
                    """,
                    (legacy_ticket_type_id,)
                )
                ticket_type_row = cur.fetchone()
                if ticket_type_row:
                    database_ticket_type_id = ticket_type_row[0]
                    if ticket_type_row[1]:
                        ticket_type_snapshot = ticket_type_row[1]
                    if ticket_type_row[2] is not None:
                        ticket_price = ticket_type_row[2]
                    linked_ticket_types += 1
                else:
                    missing_ticket_types += 1
                    print(
                        f"TICKET TYPE NOT FOUND FOR BOOKING "
                        f"{legacy_booking_id}: "
                        f"{legacy_ticket_type_id}"
                    )
            # -----------------------------------------------------
            # PAYMENT
            # -----------------------------------------------------
            database_payment_id = None
            if legacy_payment_id is not None:
                cur.execute(
                    """
                    SELECT id
                    FROM payments
                    WHERE id = %s
                    """,
                    (legacy_payment_id,)
                )
                payment_row = cur.fetchone()
                if payment_row:
                    database_payment_id = payment_row[0]
                    linked_payments += 1
                else:
                    missing_payments += 1
                    print(
                        f"PAYMENT NOT FOUND FOR BOOKING "
                        f"{legacy_booking_id}: "
                        f"{legacy_payment_id}"
                    )
            # -----------------------------------------------------
            # Buyer information
            # -----------------------------------------------------
            buyer_name_snapshot = first_value(
                booking,
                "buyerName",
                "customerName",
                "name"
            )
            buyer_email_snapshot = first_value(
                booking,
                "buyerEmail",
                "customerEmail",
                "email"
            )
            # -----------------------------------------------------
            # Financial fields
            # -----------------------------------------------------
            quantity = first_value(
                booking,
                "quantity",
                default=1
            )
            subtotal = first_value(
                booking,
                "subtotal",
                default=0
            )
            service_fee = first_value(
                booking,
                "serviceFee",
                "service_fee",
                default=0
            )
            service_fee_percent = first_value(
                booking,
                "serviceFeePercent",
                "service_fee_percent",
                default=5
            )
            customer_total = first_value(
                booking,
                "totalAmount",
                "total",
                "amount",
                "customerTotal",
                default=0
            )
            commission_percent = first_value(
                booking,
                "commissionPercent",
                "commission_percent",
                default=10
            )
            commission_amount = first_value(
                booking,
                "commissionAmount",
                "commission_amount",
                default=None
            )
            host_amount = first_value(
                booking,
                "hostAmount",
                "host_amount",
                default=None
            )
            eventwaa_ticket_amount = first_value(
                booking,
                "eventWaaTicketAmount",
                "eventwaaTicketAmount",
                default=None
            )
            eventwaa_amount = first_value(
                booking,
                "eventWaaAmount",
                "eventwaaAmount",
                default=None
            )
            service_fee_retained = first_value(
                booking,
                "serviceFeeRetained",
                "service_fee_retained",
                default=None
            )
            # -----------------------------------------------------
            # Transaction information
            # -----------------------------------------------------
            transaction_id = first_value(
                booking,
                "transactionId",
                "transaction_id"
            )
            tx_ref = first_value(
                booking,
                "txRef",
                "tx_ref"
            )
            payment_provider = first_value(
                booking,
                "paymentProvider",
                "provider",
                default="flutterwave"
            )
            # -----------------------------------------------------
            # Booking status
            # -----------------------------------------------------
            status = first_value(
                booking,
                "status",
                default="confirmed"
            )
            refund_status = first_value(
                booking,
                "refundStatus",
                "refund_status"
            )
            # -----------------------------------------------------
            # Email information
            # -----------------------------------------------------
            email_sent = bool(
                first_value(
                    booking,
                    "emailSent",
                    "email_sent",
                    default=False
                )
            )
            email_sent_at = parse_timestamp(
                first_value(
                    booking,
                    "emailSentAt",
                    "email_sent_at"
                )
            )
            email_error = first_value(
                booking,
                "emailError",
                "email_error"
            )
            # -----------------------------------------------------
            # Timestamps
            #
            # updated_at is NOT NULL.
            # Legacy records may not have updatedAt.
            # Therefore we explicitly fall back to createdAt.
            # -----------------------------------------------------
            created_at = parse_timestamp(
                first_value(
                    booking,
                    "createdAt",
                    "created_at"
                )
            )
            updated_at = parse_timestamp(
                first_value(
                    booking,
                    "updatedAt",
                    "updated_at"
                )
            )
            if updated_at is None:
                updated_at = created_at
            if created_at is None:
                raise RuntimeError(
                    f"Booking {legacy_booking_id} has no valid "
                    f"createdAt timestamp."
                )
            # -----------------------------------------------------
            # Insert booking
            # -----------------------------------------------------
            cur.execute(
                """
                INSERT INTO bookings (
                    event_id,
                    owner_user_id,
                    payment_id,
                    event_title_snapshot,
                    event_date_snapshot,
                    event_time_snapshot,
                    event_venue_snapshot,
                    event_city_snapshot,
                    buyer_name_snapshot,
                    buyer_email_snapshot,
                    ticket_type_snapshot,
                    ticket_type_id,
                    ticket_price,
                    quantity,
                    subtotal,
                    service_fee,
                    service_fee_percent,
                    customer_total,
                    commission_percent,
                    commission_amount,
                    host_amount,
                    eventwaa_ticket_amount,
                    eventwaa_amount,
                    service_fee_retained,
                    transaction_id,
                    tx_ref,
                    payment_provider,
                    refund_status,
                    email_sent,
                    email_sent_at,
                    email_error,
                    created_at,
                    updated_at
                )
                VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
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
                    database_event_id,
                    database_user_id,
                    database_payment_id,
                    event_title_snapshot,
                    event_date_snapshot,
                    event_time_snapshot,
                    event_venue_snapshot,
                    event_city_snapshot,
                    buyer_name_snapshot,
                    buyer_email_snapshot,
                    ticket_type_snapshot,
                    database_ticket_type_id,
                    ticket_price,
                    quantity,
                    subtotal,
                    service_fee,
                    service_fee_percent,
                    customer_total,
                    commission_percent,
                    commission_amount,
                    host_amount,
                    eventwaa_ticket_amount,
                    eventwaa_amount,
                    service_fee_retained,
                    transaction_id,
                    tx_ref,
                    payment_provider,
                    refund_status,
                    email_sent,
                    email_sent_at,
                    email_error,
                    created_at,
                    updated_at,
                )
            )
            new_booking_id = cur.fetchone()[0]
            print(
                f"MIGRATED BOOKING: "
                f"{new_booking_id} "
                f"(legacy {legacy_booking_id})"
            )
            migrated += 1
        # ---------------------------------------------------------
        # Update payments.booking_id
        #
        # The legacy payment IDs and new booking IDs are different,
        # so use tx_ref to establish the relationship where possible.
        # ---------------------------------------------------------
        cur.execute(
            """
            SELECT id, tx_ref
            FROM bookings
            WHERE tx_ref IS NOT NULL
            """
        )
        migrated_bookings = cur.fetchall()
        payment_links_updated = 0
        for database_booking_id, booking_tx_ref in migrated_bookings:
            cur.execute(
                """
                SELECT id
                FROM payments
                WHERE tx_ref = %s
                LIMIT 1
                """,
                (booking_tx_ref,)
            )
            payment_row = cur.fetchone()
            if payment_row:
                cur.execute(
                    """
                    UPDATE payments
                    SET booking_id = %s,
                        updated_at = COALESCE(
                            updated_at,
                            created_at
                        )
                    WHERE id = %s
                    """,
                    (
                        database_booking_id,
                        payment_row[0]
                    )
                )
                payment_links_updated += 1
        conn.commit()
        print("")
        print("BOOKINGS MIGRATION SUCCESSFUL")
        print(f"MIGRATED BOOKINGS: {migrated}")
        print(f"USERS LINKED: {linked_users}")
        print(f"EVENTS LINKED: {linked_events}")
        print(f"TICKET TYPES LINKED: {linked_ticket_types}")
        print(f"PAYMENTS FOUND BY LEGACY ID: {linked_payments}")
        print(f"MISSING USERS: {missing_users}")
        print(f"MISSING EVENTS: {missing_events}")
        print(f"MISSING TICKET TYPES: {missing_ticket_types}")
        print(f"MISSING PAYMENTS: {missing_payments}")
        print(
            f"PAYMENT LINKS UPDATED BY TX REF: "
            f"{payment_links_updated}"
        )
finally:
    conn.close()