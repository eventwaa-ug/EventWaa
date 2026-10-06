import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

conn = psycopg.connect(DATABASE_URL)

try:
    with conn.cursor() as cur:

        cur.execute("""
            SELECT
                b.id AS booking_id,
                b.event_id,
                b.owner_user_id,
                b.payment_id,
                b.quantity,
                b.subtotal,
                b.service_fee,
                b.customer_total,
                b.tx_ref,
                u.email AS user_email,
                e.title AS event_title,
                p.transaction_id,
                p.booking_id AS payment_booking_id
            FROM bookings b
            LEFT JOIN users u
                ON u.id = b.owner_user_id
            LEFT JOIN events e
                ON e.id = b.event_id
            LEFT JOIN payments p
                ON p.id = b.payment_id
            ORDER BY b.id
        """)

        rows = cur.fetchall()

        print("===== BOOKINGS LINK VERIFICATION =====")
        print(f"BOOKINGS FOUND: {len(rows)}")
        print("")

        for row in rows:
            print(
                f"BOOKING {row[0]} | "
                f"EVENT {row[1]} | "
                f"USER {row[2]} | "
                f"PAYMENT {row[3]} | "
                f"QTY {row[4]} | "
                f"SUBTOTAL {row[5]} | "
                f"FEE {row[6]} | "
                f"TOTAL {row[7]} | "
                f"TX_REF {row[8]}"
            )

            print(
                f"    USER EMAIL: {row[9]}"
            )

            print(
                f"    EVENT: {row[10]}"
            )

            print(
                f"    PAYMENT TX: {row[11]}"
            )

            print(
                f"    PAYMENT.BOOKING_ID: {row[12]}"
            )

            print("")

        # ---------------------------------------------------------
        # Relationship checks
        # ---------------------------------------------------------

        cur.execute("""
            SELECT COUNT(*)
            FROM bookings
            WHERE owner_user_id IS NULL
        """)
        missing_users = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*)
            FROM bookings
            WHERE event_id IS NULL
        """)
        missing_events = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*)
            FROM bookings
            WHERE payment_id IS NULL
        """)
        missing_payments = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*)
            FROM bookings b
            LEFT JOIN payments p
                ON p.id = b.payment_id
            WHERE p.id IS NULL
        """)
        broken_payment_links = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*)
            FROM bookings b
            LEFT JOIN users u
                ON u.id = b.owner_user_id
            WHERE u.id IS NULL
        """)
        broken_user_links = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*)
            FROM bookings b
            LEFT JOIN events e
                ON e.id = b.event_id
            WHERE e.id IS NULL
        """)
        broken_event_links = cur.fetchone()[0]

        print("===== BOOKING RELATIONSHIP CHECK =====")
        print(f"MISSING USERS: {missing_users}")
        print(f"MISSING EVENTS: {missing_events}")
        print(f"MISSING PAYMENTS: {missing_payments}")
        print(f"BROKEN USER LINKS: {broken_user_links}")
        print(f"BROKEN EVENT LINKS: {broken_event_links}")
        print(f"BROKEN PAYMENT LINKS: {broken_payment_links}")

finally:
    conn.close()