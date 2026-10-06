import os
import json
from datetime import datetime
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
def parse_legacy_datetime(value):
    if not value:
        return None
    return datetime.strptime(
        value,
        "%Y-%m-%d %H:%M:%S"
    )
# ============================================================
# MIGRATION
# ============================================================
def migrate_admin_wallet_transactions():
    print("===== ADMIN WALLET TRANSACTIONS MIGRATION =====")
    wallet = load_wallet()
    sale_transactions = [
        transaction
        for transaction in wallet.get("transactions", [])
        if transaction.get("type") == "sale"
    ]
    platform_withdrawals = wallet.get("withdrawals", [])
    print(
        f"LEGACY SALE TRANSACTIONS FOUND: "
        f"{len(sale_transactions)}"
    )
    print(
        f"LEGACY PLATFORM WITHDRAWALS FOUND: "
        f"{len(platform_withdrawals)}"
    )
    with get_db_connection() as conn:
        # ----------------------------------------------------
        # Locate platform wallet
        # ----------------------------------------------------
        admin_wallet = conn.execute(
            """
            SELECT id
            FROM admin_wallet
            WHERE id = 1
            """
        ).fetchone()
        if not admin_wallet:
            raise RuntimeError(
                "Platform admin wallet with id=1 was not found"
            )
        wallet_id = admin_wallet["id"]
        print(
            f"USING ADMIN WALLET: {wallet_id}"
        )
        # ----------------------------------------------------
        # Existing transaction count
        # ----------------------------------------------------
        existing_count = conn.execute(
            """
            SELECT COUNT(*)
            FROM admin_wallet_transactions
            """
        ).fetchone()["count"]
        print(
            f"EXISTING ADMIN WALLET TRANSACTIONS: "
            f"{existing_count}"
        )
        # ----------------------------------------------------
        # Existing references for idempotency
        # ----------------------------------------------------
        existing_references = conn.execute(
            """
            SELECT reference
            FROM admin_wallet_transactions
            WHERE reference IS NOT NULL
            """
        ).fetchall()
        existing_reference_set = {
            row["reference"]
            for row in existing_references
        }
        # ----------------------------------------------------
        # Load payment mappings
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
        # Counters
        # ----------------------------------------------------
        migrated_sales = 0
        migrated_withdrawals = 0
        skipped = 0
        missing_payments = 0
        missing_events = 0
        missing_bookings = 0
        prepared_rows = []
        # ====================================================
        # PREPARE SALE TRANSACTIONS
        # ====================================================
        for transaction in sale_transactions:
            tx_ref = transaction.get("txRef")
            transaction_id = transaction.get("transactionId")
            event_id = transaction.get("eventId")
            if not tx_ref:
                print(
                    f"SKIPPING SALE WITHOUT txRef: "
                    f"{transaction_id}"
                )
                skipped += 1
                continue
            if tx_ref in existing_reference_set:
                print(
                    f"SKIPPING EXISTING ADMIN WALLET TRANSACTION: "
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
                    f"PAYMENT NOT FOUND FOR SALE: {tx_ref}"
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
                    f"EVENT NOT FOUND FOR SALE "
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
            # Platform revenue
            # ------------------------------------------------
            commission = float(
                transaction.get("commission") or 0
            )
            service_fee = float(
                transaction.get("serviceFee") or 0
            )
            platform_amount = commission + service_fee
            metadata = {
                "legacy_source": "wallet.json",
                "legacy_wallet_type": "platform",
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
                    "refund_id": None,
                    "withdrawal_id": None,
                    "type": "sale",
                    "amount": platform_amount,
                    "currency": "UGX",
                    "status": "completed",
                    "description": (
                        f"Platform revenue from "
                        f"{transaction.get('eventTitle')}"
                    ),
                    "reference": tx_ref,
                    "balance_before": None,
                    "balance_after": None,
                    "created_at": parse_legacy_datetime(
                        transaction.get("date")
                    ),
                    "metadata": metadata
                }
            )
        # ====================================================
        # PREPARE PLATFORM WITHDRAWALS
        # ====================================================
        for withdrawal in platform_withdrawals:
            legacy_id = withdrawal.get("id")
            reference = withdrawal.get(
                "transferReference"
            )
            if not reference:
                reference = (
                    f"LEGACY-PLATFORM-WITHDRAWAL-{legacy_id}"
                )
            if reference in existing_reference_set:
                print(
                    f"SKIPPING EXISTING PLATFORM WITHDRAWAL: "
                    f"{reference}"
                )
                skipped += 1
                continue
            amount = float(
                withdrawal.get("amount") or 0
            )
            if amount <= 0:
                print(
                    f"SKIPPING INVALID PLATFORM WITHDRAWAL "
                    f"{legacy_id}: amount={amount}"
                )
                skipped += 1
                continue
            # Platform withdrawal is represented as a negative
            # admin-wallet transaction.
            transaction_amount = -amount
            metadata = {
                "legacy_source": "wallet.json",
                "legacy_wallet_type": "platform",
                "legacy_withdrawal": withdrawal,
                "legacy_withdrawal_id": legacy_id,
                "platform_withdrawal": True,
                "note": (
                    "Historical platform withdrawal. "
                    "withdrawal_id intentionally NULL because "
                    "the withdrawals table represents host "
                    "withdrawals linked to host_wallets."
                )
            }
            prepared_rows.append(
                {
                    "event_id": None,
                    "booking_id": None,
                    "payment_id": None,
                    "refund_id": None,
                    "withdrawal_id": None,
                    "type": "withdrawal",
                    "amount": transaction_amount,
                    "currency": "UGX",
                    "status": withdrawal.get(
                        "status",
                        "completed"
                    ),
                    "description": (
                        "Platform wallet withdrawal"
                    ),
                    "reference": reference,
                    "balance_before": None,
                    "balance_after": None,
                    "created_at": parse_legacy_datetime(
                        withdrawal.get("date")
                    ),
                    "metadata": metadata
                }
            )
        # ====================================================
        # INSERT ALL PREPARED TRANSACTIONS
        # ====================================================
        for row in prepared_rows:
            conn.execute(
                """
                INSERT INTO admin_wallet_transactions (
                    wallet_id,
                    event_id,
                    booking_id,
                    payment_id,
                    refund_id,
                    withdrawal_id,
                    type,
                    amount,
                    currency,
                    status,
                    description,
                    reference,
                    balance_before,
                    balance_after,
                    created_at,
                    metadata
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
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    wallet_id,
                    row["event_id"],
                    row["booking_id"],
                    row["payment_id"],
                    row["refund_id"],
                    row["withdrawal_id"],
                    row["type"],
                    row["amount"],
                    row["currency"],
                    row["status"],
                    row["description"],
                    row["reference"],
                    row["balance_before"],
                    row["balance_after"],
                    row["created_at"],
                    json.dumps(row["metadata"])
                )
            )
            if row["type"] == "sale":
                migrated_sales += 1
                print(
                    f"MIGRATED ADMIN WALLET SALE: "
                    f"{row['reference']} → "
                    f"amount {row['amount']}"
                )
            elif row["type"] == "withdrawal":
                migrated_withdrawals += 1
                print(
                    f"MIGRATED ADMIN WALLET WITHDRAWAL: "
                    f"{row['reference']} → "
                    f"amount {row['amount']}"
                )
        # ----------------------------------------------------
        # Commit only after all records succeed
        # ----------------------------------------------------
        conn.commit()
        print()
        print(
            "ADMIN WALLET TRANSACTIONS MIGRATION SUCCESSFUL"
        )
        print(
            f"MIGRATED SALE TRANSACTIONS: "
            f"{migrated_sales}"
        )
        print(
            f"MIGRATED PLATFORM WITHDRAWALS: "
            f"{migrated_withdrawals}"
        )
        print(f"SKIPPED RECORDS: {skipped}")
        print(f"MISSING PAYMENTS: {missing_payments}")
        print(f"MISSING EVENTS: {missing_events}")
        print(f"MISSING BOOKINGS: {missing_bookings}")
# ============================================================
# RUN
# ============================================================
if __name__ == "__main__":
    migrate_admin_wallet_transactions()