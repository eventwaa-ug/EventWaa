import json
import os
from datetime import datetime
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HOST_WALLETS_FILE = os.path.join(BASE_DIR, "host_wallets.json")
# ---------------------------------------------------------
# Database connection
# ---------------------------------------------------------
def get_db_connection():
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row
    )
# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------
def parse_datetime(value):
    """
    Convert legacy datetime strings into Python datetime objects.
    Legacy examples:
        2026-08-17 16:16:36
        2026-08-18
    """
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    value = str(value).strip()
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise ValueError(f"Unsupported legacy datetime format: {value}")
def load_host_wallets():
    if not os.path.exists(HOST_WALLETS_FILE):
        raise FileNotFoundError(
            f"Legacy file not found: {HOST_WALLETS_FILE}"
        )
    with open(HOST_WALLETS_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError("host_wallets.json must contain a list")
    return data
# ---------------------------------------------------------
# Migration
# ---------------------------------------------------------
def migrate_wallet_transactions():
    print("===== WALLET TRANSACTIONS MIGRATION =====")
    host_wallets = load_host_wallets()
    print(f"HOST WALLET RECORDS FOUND IN JSON: {len(host_wallets)}")
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # -------------------------------------------------
            # Existing transaction IDs
            # -------------------------------------------------
            cur.execute("""
                SELECT metadata
                FROM wallet_transactions
            """)
            existing_rows = cur.fetchall()
            existing_legacy_ids = set()
            for row in existing_rows:
                metadata = row["metadata"]
                if isinstance(metadata, dict):
                    legacy_id = metadata.get("legacyTransactionId")
                    if legacy_id:
                        existing_legacy_ids.add(str(legacy_id))
            print(
                "EXISTING LEGACY WALLET TRANSACTIONS: "
                f"{len(existing_legacy_ids)}"
            )
            # -------------------------------------------------
            # Cache host wallets
            # -------------------------------------------------
            cur.execute("""
                SELECT id, user_id
                FROM host_wallets
            """)
            db_host_wallets = {
                row["user_id"]: row
                for row in cur.fetchall()
                if row["user_id"] is not None
            }
            migrated = 0
            skipped = 0
            missing_hosts = 0
            # -------------------------------------------------
            # Process legacy host wallets
            # -------------------------------------------------
            for legacy_wallet in host_wallets:
                legacy_host_id = legacy_wallet.get("hostId")
                # hostId 0 represents the platform wallet.
                # Platform transactions belong in
                # admin_wallet_transactions, not here.
                if legacy_host_id in (None, 0):
                    print(
                        f"SKIPPING PLATFORM/INVALID HOST WALLET: "
                        f"{legacy_host_id}"
                    )
                    continue
                host_wallet = db_host_wallets.get(legacy_host_id)
                if not host_wallet:
                    print(
                        f"HOST WALLET NOT FOUND IN DATABASE: "
                        f"hostId={legacy_host_id}"
                    )
                    missing_hosts += 1
                    continue
                wallet_id = host_wallet["id"]
                user_id = host_wallet["user_id"]
                transactions = legacy_wallet.get("transactions", [])
                print(
                    f"HOST {legacy_host_id}: "
                    f"{len(transactions)} LEGACY TRANSACTIONS"
                )
                for transaction in transactions:
                    legacy_transaction_id = transaction.get("id")
                    if not legacy_transaction_id:
                        print(
                            "SKIPPING TRANSACTION WITHOUT LEGACY ID"
                        )
                        skipped += 1
                        continue
                    legacy_transaction_id = str(legacy_transaction_id)
                    # -------------------------------------------------
                    # Idempotency check
                    # -------------------------------------------------
                    if legacy_transaction_id in existing_legacy_ids:
                        print(
                            f"SKIPPING EXISTING TRANSACTION: "
                            f"{legacy_transaction_id}"
                        )
                        skipped += 1
                        continue
                    # -------------------------------------------------
                    # Required transaction values
                    # -------------------------------------------------
                    transaction_type = transaction.get("type")
                    if not transaction_type:
                        raise ValueError(
                            f"Transaction {legacy_transaction_id} "
                            "has no type"
                        )
                    if transaction.get("amount") is None:
                        raise ValueError(
                            f"Transaction {legacy_transaction_id} "
                            "has no amount"
                        )
                    amount = transaction["amount"]
                    if amount == 0:
                        raise ValueError(
                            f"Transaction {legacy_transaction_id} "
                            "has zero amount"
                        )
                    created_at = parse_datetime(
                        transaction.get("date")
                    )
                    if not created_at:
                        raise ValueError(
                            f"Transaction {legacy_transaction_id} "
                            "has no valid date"
                        )
                    status = transaction.get(
                        "status",
                        "completed"
                    )
                    description = transaction.get("description")
                    # -------------------------------------------------
                    # Preserve the complete legacy transaction
                    # -------------------------------------------------
                    metadata = {
                        "legacyTransactionId": legacy_transaction_id,
                        "legacyHostId": legacy_host_id,
                        "legacyTransaction": transaction,
                        "migrationSource": "host_wallets.json",
                    }
                    # -------------------------------------------------
                    # Insert
                    # -------------------------------------------------
                    cur.execute(
                        """
                        INSERT INTO wallet_transactions (
                            wallet_id,
                            user_id,
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
                            balance_before,
                            balance_after,
                            created_at,
                            metadata
                        )
                        VALUES (
                            %s,
                            %s,
                            NULL,
                            NULL,
                            NULL,
                            NULL,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            NULL,
                            NULL,
                            %s,
                            %s
                        )
                        """,
                        (
                            wallet_id,
                            user_id,
                            transaction_type,
                            amount,
                            "UGX",
                            status,
                            description,
                            transaction.get("transferReference"),
                            created_at,
                            json.dumps(metadata),
                        )
                    )
                    print(
                        f"MIGRATED WALLET TRANSACTION: "
                        f"{legacy_transaction_id} "
                        f"→ host wallet {wallet_id}"
                    )
                    existing_legacy_ids.add(
                        legacy_transaction_id
                    )
                    migrated += 1
            # -------------------------------------------------
            # Commit only after every record succeeds
            # -------------------------------------------------
            conn.commit()
    print()
    print("WALLET TRANSACTIONS MIGRATION SUCCESSFUL")
    print(f"MIGRATED TRANSACTIONS: {migrated}")
    print(f"SKIPPED TRANSACTIONS: {skipped}")
    print(f"MISSING HOST WALLETS: {missing_hosts}")
# ---------------------------------------------------------
# Main
# ---------------------------------------------------------
if __name__ == "__main__":
    migrate_wallet_transactions()