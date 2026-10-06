import os
import json
import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row
# ============================================================
# LOAD ENVIRONMENT
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")
# ============================================================
# FILE PATH
# ============================================================
WALLET_FILE = os.path.join(BASE_DIR, "wallet.json")
# ============================================================
# HELPERS
# ============================================================
def load_wallet():
    with open(WALLET_FILE, "r", encoding="utf-8") as file:
        return json.load(file)
def get_db_connection():
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row
    )
# ============================================================
# MIGRATION
# ============================================================
def migrate_platform_revenue():
    print("===== PLATFORM REVENUE MIGRATION =====")
    wallet = load_wallet()
    transactions = wallet.get("transactions", [])
    print(f"LEGACY WALLET TRANSACTIONS FOUND: {len(transactions)}")
    # Only sale transactions belong in platform_revenue.
    revenue_transactions = [
        transaction
        for transaction in transactions
        if transaction.get("type") == "sale"
    ]
    print(
        f"LEGACY PLATFORM REVENUE TRANSACTIONS: "
        f"{len(revenue_transactions)}"
    )
    with get_db_connection() as conn:
        # ----------------------------------------------------
        # Check existing records
        # ----------------------------------------------------
        existing_count = conn.execute(
            """
            SELECT COUNT(*)
            FROM platform_revenue
            """
        ).fetchone()["count"]
        print(
            f"EXISTING PLATFORM REVENUE RECORDS IN DATABASE: "
            f"{existing_count}"
        )
        # ----------------------------------------------------
        # Build mappings from already-migrated payments
        # ----------------------------------------------------
        payment_rows = conn.execute(
            """
            SELECT
                id,
                event_id,
                booking_id,
                tx_ref,
                transaction_id
            FROM payments
            WHERE tx_ref IS NOT NULL
            """
        ).fetchall()
        payments_by_tx_ref = {
            row["tx_ref"]: row
            for row in payment_rows
        }
        # ----------------------------------------------------
        # Existing references for idempotency
        # ----------------------------------------------------
        existing_references = conn.execute(
            """
            SELECT reference
            FROM platform_revenue
            WHERE reference IS NOT NULL
            """
        ).fetchall()
        existing_reference_set = {
            row["reference"]
            for row in existing_references
        }
        migrated = 0
        skipped = 0
        missing_payments = 0
        missing_events = 0
        missing_bookings = 0
        # ----------------------------------------------------
        # Prepare all records first
        # ----------------------------------------------------
        prepared_rows = []
        for transaction in revenue_transactions:
            tx_ref = transaction.get("txRef")
            transaction_id = transaction.get("transactionId")
            event_id = transaction.get("eventId")
            if not tx_ref:
                print(
                    f"SKIPPING TRANSACTION WITHOUT txRef: "
                    f"{transaction_id}"
                )
                skipped += 1
                continue
            if tx_ref in existing_reference_set:
                print(
                    f"SKIPPING EXISTING PLATFORM REVENUE: "
                    f"{tx_ref}"
                )
                skipped += 1
                continue
            # ------------------------------------------------
            # Resolve payment
            # ------------------------------------------------
            payment = payments_by_tx_ref.get(tx_ref)
            payment_id = None
            booking_id = None
            if payment:
                payment_id = payment["id"]
                booking_id = payment["booking_id"]
            else:
                missing_payments += 1
                print(
                    f"PAYMENT NOT FOUND FOR txRef: {tx_ref}"
                )
            # ------------------------------------------------
            # Verify event
            # ------------------------------------------------
            event_exists = conn.execute(
                """
                SELECT id
                FROM events
                WHERE id = %s
                """,
                (event_id,)
            ).fetchone()
            if not event_exists:
                print(
                    f"EVENT NOT FOUND FOR REVENUE TRANSACTION "
                    f"{transaction_id}: {event_id}"
                )
                missing_events += 1
                event_id = None
            # ------------------------------------------------
            # Verify booking
            # ------------------------------------------------
            if booking_id is not None:
                booking_exists = conn.execute(
                    """
                    SELECT id
                    FROM bookings
                    WHERE id = %s
                    """,
                    (booking_id,)
                ).fetchone()
                if not booking_exists:
                    print(
                        f"BOOKING NOT FOUND FOR PAYMENT "
                        f"{payment_id}: {booking_id}"
                    )
                    missing_bookings += 1
                    booking_id = None
            # ------------------------------------------------
            # Platform revenue amount
            # ------------------------------------------------
            commission = float(
                transaction.get("commission") or 0
            )
            service_fee = float(
                transaction.get("serviceFee") or 0
            )
            platform_amount = commission + service_fee
            # ------------------------------------------------
            # Metadata preserves original source
            # ------------------------------------------------
            metadata = {
                "legacy_source": "wallet.json",
                "legacy_transaction": transaction,
                "legacy_transaction_id": transaction_id,
                "event_title": transaction.get("eventTitle"),
                "payment_provider": transaction.get(
                    "paymentProvider"
                ),
                "ticket_subtotal": transaction.get(
                    "ticketSubtotal"
                ),
                "commission": transaction.get(
                    "commission"
                ),
                "commission_percent": transaction.get(
                    "commissionPercent"
                ),
                "service_fee": transaction.get(
                    "serviceFee"
                ),
                "customer_paid": transaction.get(
                    "customerPaid"
                )
            }
            prepared_rows.append(
                {
                    "event_id": event_id,
                    "booking_id": booking_id,
                    "payment_id": payment_id,
                    "type": "sale",
                    "amount": platform_amount,
                    "currency": "UGX",
                    "status": "completed",
                    "description": (
                        f"Platform revenue from "
                        f"{transaction.get('eventTitle')}"
                    ),
                    "reference": tx_ref,
                    "created_at": transaction.get("date"),
                    "metadata": metadata
                }
            )
        # ----------------------------------------------------
        # Insert prepared records
        # ----------------------------------------------------
        for row in prepared_rows:
            conn.execute(
                """
                INSERT INTO platform_revenue (
                    event_id,
                    booking_id,
                    payment_id,
                    refund_id,
                    type,
                    amount,
                    currency,
                    status,
                    description,
                    reference,
                    created_at,
                    metadata
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    NULL,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    row["event_id"],
                    row["booking_id"],
                    row["payment_id"],
                    row["type"],
                    row["amount"],
                    row["currency"],
                    row["status"],
                    row["description"],
                    row["reference"],
                    row["created_at"],
                    json.dumps(row["metadata"])
                )
            )
            migrated += 1
            print(
                f"MIGRATED PLATFORM REVENUE: "
                f"{row['reference']} → "
                f"amount {row['amount']}"
            )
        # ----------------------------------------------------
        # Commit only after every insert succeeds
        # ----------------------------------------------------
        conn.commit()
        print()
        print("PLATFORM REVENUE MIGRATION SUCCESSFUL")
        print(f"MIGRATED REVENUE RECORDS: {migrated}")
        print(f"SKIPPED RECORDS: {skipped}")
        print(f"MISSING PAYMENTS: {missing_payments}")
        print(f"MISSING EVENTS: {missing_events}")
        print(f"MISSING BOOKINGS: {missing_bookings}")
# ============================================================
# RUN
# ============================================================
if __name__ == "__main__":
    migrate_platform_revenue()