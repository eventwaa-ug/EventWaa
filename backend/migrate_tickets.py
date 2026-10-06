import os
import json
from pathlib import Path
from decimal import Decimal
import psycopg
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")
# ---------------------------------------------------------
# FIND LEGACY BOOKINGS.JSON
# ---------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent
matches = list(BACKEND_DIR.rglob("bookings.json"))
if not matches:
    raise FileNotFoundError(
        "Could not find bookings.json inside the backend directory."
    )
if len(matches) > 1:
    print("Multiple bookings.json files found:")
    for path in matches:
        print(f" - {path}")
    raise RuntimeError(
        "More than one bookings.json file was found. "
        "Please keep only the correct legacy bookings.json."
    )
BOOKINGS_FILE = matches[0]
print(f"Using legacy bookings file: {BOOKINGS_FILE}")
# ---------------------------------------------------------
# LOAD LEGACY BOOKINGS
# ---------------------------------------------------------
with open(BOOKINGS_FILE, "r", encoding="utf-8") as f:
    legacy_bookings = json.load(f)
if not isinstance(legacy_bookings, list):
    raise RuntimeError("bookings.json does not contain a list.")
print(f"LEGACY BOOKINGS FOUND: {len(legacy_bookings)}")
# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------
def to_decimal(value):
    if value is None:
        return Decimal("0")
    return Decimal(str(value))
def get_value(data, *keys, default=None):
    for key in keys:
        if key in data:
            return data[key]
    return default
# ---------------------------------------------------------
# DATABASE MIGRATION
# ---------------------------------------------------------
conn = psycopg.connect(DATABASE_URL)
try:
    with conn.cursor() as cur:
        # -------------------------------------------------
        # CHECK EXISTING TICKETS
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM tickets
        """)
        existing_count = cur.fetchone()[0]
        print(f"EXISTING TICKETS IN DATABASE: {existing_count}")
        # -------------------------------------------------
        # DETERMINE NEXT DATABASE TICKET ID
        # -------------------------------------------------
        cur.execute("""
            SELECT COALESCE(MAX(id), 0)
            FROM tickets
        """)
        next_ticket_id = cur.fetchone()[0] + 1
        migrated = 0
        skipped_no_tickets = 0
        skipped_existing = 0
        missing_bookings = 0
        missing_ticket_types = 0
        # -------------------------------------------------
        # PROCESS EACH LEGACY BOOKING
        # -------------------------------------------------
        for legacy_booking in legacy_bookings:
            legacy_booking_id = get_value(
                legacy_booking,
                "id"
            )
            legacy_tx_ref = get_value(
                legacy_booking,
                "txRef",
                "tx_ref"
            )
            legacy_tickets = get_value(
                legacy_booking,
                "tickets",
                default=[]
            )
            if not legacy_tickets:
                skipped_no_tickets += 1
                continue
            # -------------------------------------------------
            # RESOLVE CURRENT DATABASE BOOKING
            #
            # IMPORTANT:
            # Legacy booking IDs are NOT guaranteed to equal
            # current database booking IDs.
            #
            # tx_ref is the stable relationship.
            # -------------------------------------------------
            db_booking = None
            if legacy_tx_ref:
                cur.execute("""
                    SELECT
                        id,
                        event_id,
                        owner_user_id,
                        ticket_type_id,
                        ticket_type_snapshot
                    FROM bookings
                    WHERE tx_ref = %s
                    LIMIT 1
                """, (legacy_tx_ref,))
                db_booking = cur.fetchone()
            # Fallback to legacy ID only if necessary
            if db_booking is None and legacy_booking_id is not None:
                cur.execute("""
                    SELECT
                        id,
                        event_id,
                        owner_user_id,
                        ticket_type_id,
                        ticket_type_snapshot
                    FROM bookings
                    WHERE id = %s
                    LIMIT 1
                """, (legacy_booking_id,))
                db_booking = cur.fetchone()
            if db_booking is None:
                print(
                    f"BOOKING NOT FOUND: "
                    f"legacy booking {legacy_booking_id}, "
                    f"tx_ref={legacy_tx_ref}"
                )
                missing_bookings += 1
                continue
            (
                db_booking_id,
                event_id,
                owner_user_id,
                booking_ticket_type_id,
                booking_ticket_type_snapshot
            ) = db_booking
            # -------------------------------------------------
            # PROCESS TICKETS
            # -------------------------------------------------
            for legacy_ticket in legacy_tickets:
                ticket_id = get_value(
                    legacy_ticket,
                    "ticketId",
                    "ticket_id",
                    "id"
                )
                if not ticket_id:
                    print(
                        f"SKIPPING TICKET WITHOUT ID "
                        f"in legacy booking {legacy_booking_id}"
                    )
                    continue
                # -------------------------------------------------
                # IDEMPOTENCY CHECK
                # -------------------------------------------------
                cur.execute("""
                    SELECT id
                    FROM tickets
                    WHERE ticket_id = %s
                    LIMIT 1
                """, (str(ticket_id),))
                existing_ticket = cur.fetchone()
                if existing_ticket:
                    print(
                        f"SKIPPING EXISTING TICKET: "
                        f"{ticket_id} "
                        f"(database id {existing_ticket[0]})"
                    )
                    skipped_existing += 1
                    continue
                # -------------------------------------------------
                # TICKET TYPE
                # -------------------------------------------------
                ticket_type_id = booking_ticket_type_id
                ticket_type_snapshot = (
                    get_value(
                        legacy_ticket,
                        "ticketType",
                        "ticket_type",
                        "ticketTypeSnapshot",
                        "ticket_type_snapshot"
                    )
                    or booking_ticket_type_snapshot
                )
                # If booking does not have ticket_type_id,
                # resolve it from the event + ticket type name.
                if ticket_type_id is None and ticket_type_snapshot:
                    cur.execute("""
                        SELECT id
                        FROM event_ticket_types
                        WHERE event_id = %s
                          AND LOWER(name) = LOWER(%s)
                        LIMIT 1
                    """, (
                        event_id,
                        str(ticket_type_snapshot)
                    ))
                    ticket_type_match = cur.fetchone()
                    if ticket_type_match:
                        ticket_type_id = ticket_type_match[0]
                    else:
                        missing_ticket_types += 1
                # -------------------------------------------------
                # PRICE
                # -------------------------------------------------
                price = get_value(
                    legacy_ticket,
                    "price",
                    "ticketPrice",
                    "ticket_price"
                )
                if price is None:
                    price = get_value(
                        legacy_booking,
                        "ticketPrice",
                        "ticket_price",
                        default=0
                    )
                price = to_decimal(price)
                # -------------------------------------------------
                # CHECK-IN STATE
                #
                # We deliberately DO NOT copy legacy
                # checkInLimit.
                #
                # EventWaa rule:
                # one ticket = one successful entry.
                # -------------------------------------------------
                checked_in = bool(
                    get_value(
                        legacy_ticket,
                        "checkedIn",
                        "checked_in",
                        default=False
                    )
                )
                check_in_count = 1 if checked_in else 0
                # -------------------------------------------------
                # VALID / CANCELLED / REFUND STATE
                # -------------------------------------------------
                valid = bool(
                    get_value(
                        legacy_ticket,
                        "valid",
                        default=True
                    )
                )
                cancelled = bool(
                    get_value(
                        legacy_ticket,
                        "cancelled",
                        default=False
                    )
                )
                refund_status = get_value(
                    legacy_ticket,
                    "refundStatus",
                    "refund_status"
                )
                refund_amount = to_decimal(
                    get_value(
                        legacy_ticket,
                        "refundAmount",
                        "refund_amount",
                        default=0
                    )
                )
                refund_fee = to_decimal(
                    get_value(
                        legacy_ticket,
                        "refundFee",
                        "refund_fee",
                        default=0
                    )
                )
                cancelled_at = get_value(
                    legacy_ticket,
                    "cancelledAt",
                    "cancelled_at"
                )
                created_at = get_value(
                    legacy_ticket,
                    "createdAt",
                    "created_at"
                )
                # -------------------------------------------------
                # TICKET NUMBER
                # -------------------------------------------------
                ticket_number = get_value(
                    legacy_ticket,
                    "ticketNumber",
                    "ticket_number"
                )
                if ticket_number is None:
                    ticket_number = str(ticket_id)
                # -------------------------------------------------
                # INSERT
                # -------------------------------------------------
                cur.execute("""
                    INSERT INTO tickets (
                        id,
                        booking_id,
                        event_id,
                        ticket_type_id,
                        ticket_id,
                        ticket_number,
                        ticket_type_snapshot,
                        price,
                        valid,
                        cancelled,
                        checked_in,
                        check_in_count,
                        check_in_limit,
                        refund_status,
                        refund_id,
                        refund_amount,
                        refund_fee,
                        created_at,
                        cancelled_at
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        1,
                        %s,
                        NULL,
                        %s,
                        %s,
                        COALESCE(%s::timestamptz, CURRENT_TIMESTAMP),
                        %s
                    )
                """, (
                    next_ticket_id,
                    db_booking_id,
                    event_id,
                    ticket_type_id,
                    str(ticket_id),
                    str(ticket_number),
                    ticket_type_snapshot,
                    price,
                    valid,
                    cancelled,
                    checked_in,
                    check_in_count,
                    refund_status,
                    refund_amount,
                    refund_fee,
                    created_at,
                    cancelled_at
                ))
                print(
                    f"MIGRATED TICKET: "
                    f"{ticket_id} "
                    f"(database id {next_ticket_id}) "
                    f"→ booking {db_booking_id}"
                )
                next_ticket_id += 1
                migrated += 1
        # -------------------------------------------------
        # COMMIT
        # -------------------------------------------------
        conn.commit()
        print("")
        print("===== TICKETS MIGRATION SUCCESSFUL =====")
        print(f"LEGACY BOOKINGS FOUND: {len(legacy_bookings)}")
        print(f"MIGRATED TICKETS: {migrated}")
        print(f"SKIPPED BOOKINGS WITHOUT TICKETS: {skipped_no_tickets}")
        print(f"SKIPPED EXISTING TICKETS: {skipped_existing}")
        print(f"MISSING BOOKINGS: {missing_bookings}")
        print(f"MISSING TICKET TYPES: {missing_ticket_types}")
finally:
    conn.close()