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
                b.id,
                b.tx_ref,
                p.id
            FROM bookings b
            JOIN payments p
                ON p.tx_ref = b.tx_ref
            WHERE b.payment_id IS NULL
        """)

        matches = cur.fetchall()

        print("===== BOOKING → PAYMENT MATCHES =====")
        print(f"MATCHES FOUND: {len(matches)}")

        for booking_id, tx_ref, payment_id in matches:

            cur.execute("""
                UPDATE bookings
                SET payment_id = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                payment_id,
                booking_id
            ))

            print(
                f"BOOKING {booking_id} "
                f"→ PAYMENT {payment_id}"
            )

        conn.commit()

        print("")
        print("BOOKING PAYMENT LINKS UPDATED")
        print(f"UPDATED LINKS: {len(matches)}")

finally:
    conn.close()