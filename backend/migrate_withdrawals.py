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
HOST_WALLETS_FILE = os.path.join(
    BASE_DIR,
    "host_wallets.json"
)
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
    raise ValueError(
        f"Unsupported legacy datetime format: {value}"
    )
def load_host_wallets():
    if not os.path.exists(HOST_WALLETS_FILE):
        raise FileNotFoundError(
            f"Legacy file not found: {HOST_WALLETS_FILE}"
        )
    with open(
        HOST_WALLETS_FILE,
        "r",
        encoding="utf-8"
    ) as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError(
            "host_wallets.json must contain a list"
        )
    return data
# ---------------------------------------------------------
# Migration
# ---------------------------------------------------------
def migrate_withdrawals():
    print("===== WITHDRAWALS MIGRATION =====")
    host_wallets = load_host_wallets()
    print(
        f"HOST WALLET RECORDS FOUND IN JSON: "
        f"{len(host_wallets)}"
    )
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # -------------------------------------------------
            # Existing withdrawal IDs
            # -------------------------------------------------
            cur.execute("""
                SELECT id
                FROM withdrawals
                ORDER BY id
            """)
            existing_ids = {
                row["id"]
                for row in cur.fetchall()
            }
            print(
                "EXISTING WITHDRAWALS IN DATABASE: "
                f"{len(existing_ids)}"
            )
            # -------------------------------------------------
            # Find database host wallets
            # -------------------------------------------------
            cur.execute("""
                SELECT
                    id,
                    user_id
                FROM host_wallets
            """)
            host_wallet_rows = cur.fetchall()
            host_wallet_map = {
                row["user_id"]: row
                for row in host_wallet_rows
                if row["user_id"] is not None
            }
            migrated = 0
            skipped = 0
            missing_hosts = 0
            # -------------------------------------------------
            # Process legacy host wallets
            # -------------------------------------------------
            for legacy_wallet in host_wallets:
                legacy_host_id = legacy_wallet.get(
                    "hostId"
                )
                # hostId 0 is the platform wallet.
                # It does not belong in the host withdrawals
                # table because withdrawals.wallet_id references
                # host_wallets.
                if legacy_host_id in (None, 0):
                    print(
                        "SKIPPING PLATFORM/INVALID HOST WALLET: "
                        f"{legacy_host_id}"
                    )
                    continue
                host_wallet = host_wallet_map.get(
                    legacy_host_id
                )
                if not host_wallet:
                    print(
                        "HOST WALLET NOT FOUND IN DATABASE: "
                        f"hostId={legacy_host_id}"
                    )
                    missing_hosts += 1
                    continue
                wallet_id = host_wallet["id"]
                user_id = host_wallet["user_id"]
                withdrawals = legacy_wallet.get(
                    "withdrawals",
                    []
                )
                print(
                    f"HOST {legacy_host_id}: "
                    f"{len(withdrawals)} LEGACY WITHDRAWALS"
                )
                # -------------------------------------------------
                # Process withdrawals
                # -------------------------------------------------
                for withdrawal in withdrawals:
                    legacy_id = withdrawal.get("id")
                    if legacy_id is None:
                        print(
                            "SKIPPING WITHDRAWAL WITHOUT "
                            "LEGACY ID"
                        )
                        skipped += 1
                        continue
                    # -------------------------------------------------
                    # Preserve the legacy ID as the database ID
                    # -------------------------------------------------
                    try:
                        withdrawal_id = int(legacy_id)
                    except (TypeError, ValueError):
                        raise ValueError(
                            "Legacy withdrawal ID must be "
                            f"numeric: {legacy_id}"
                        )
                    if withdrawal_id in existing_ids:
                        print(
                            "SKIPPING EXISTING WITHDRAWAL: "
                            f"{withdrawal_id}"
                        )
                        skipped += 1
                        continue
                    # -------------------------------------------------
                    # Required fields
                    # -------------------------------------------------
                    if withdrawal.get("amount") is None:
                        raise ValueError(
                            f"Withdrawal {withdrawal_id} "
                            "has no amount"
                        )
                    amount = withdrawal["amount"]
                    if amount <= 0:
                        raise ValueError(
                            f"Withdrawal {withdrawal_id} "
                            f"has invalid amount: {amount}"
                        )
                    requested_at = parse_datetime(
                        withdrawal.get("date")
                    )
                    if not requested_at:
                        raise ValueError(
                            f"Withdrawal {withdrawal_id} "
                            "has no valid date"
                        )
                    status = withdrawal.get(
                        "status",
                        "pending"
                    )
                    method = withdrawal.get("method")
                    # -------------------------------------------------
                    # Provider
                    # -------------------------------------------------
                    provider = None
                    if withdrawal.get(
                        "flutterwaveStatus"
                    ) is not None:
                        provider = "flutterwave"
                    # -------------------------------------------------
                    # Provider reference
                    # -------------------------------------------------
                    provider_reference = (
                        withdrawal.get(
                            "transferReference"
                        )
                    )
                    # -------------------------------------------------
                    # Processed timestamp
                    # -------------------------------------------------
                    processed_at = None
                    if withdrawal.get("approvedAt"):
                        processed_at = parse_datetime(
                            withdrawal.get(
                                "approvedAt"
                            )
                        )
                    # -------------------------------------------------
                    # Preserve complete legacy withdrawal
                    # -------------------------------------------------
                    metadata = {
                        "legacyWithdrawalId": withdrawal_id,
                        "legacyHostId": legacy_host_id,
                        "legacyWithdrawal": withdrawal,
                        "migrationSource": "host_wallets.json",
                    }
                    # -------------------------------------------------
                    # Insert
                    # -------------------------------------------------
                    cur.execute(
                        """
                        INSERT INTO withdrawals (
                            id,
                            user_id,
                            wallet_id,
                            amount,
                            currency,
                            status,
                            method,
                            provider,
                            provider_reference,
                            account_name,
                            account_number,
                            requested_at,
                            processed_at,
                            processed_by,
                            failure_reason,
                            idempotency_key,
                            metadata
                        )
                        VALUES (
                            %s,
                            %s,
                            %s,
                            %s,
                            'UGX',
                            %s,
                            %s,
                            %s,
                            %s,
                            NULL,
                            %s,
                            %s,
                            %s,
                            NULL,
                            NULL,
                            NULL,
                            %s
                        )
                        """,
                        (
                            withdrawal_id,
                            user_id,
                            wallet_id,
                            amount,
                            status,
                            method,
                            provider,
                            provider_reference,
                            withdrawal.get("account"),
                            requested_at,
                            processed_at,
                            json.dumps(metadata),
                        )
                    )
                    print(
                        f"MIGRATED WITHDRAWAL: "
                        f"{withdrawal_id} "
                        f"→ host wallet {wallet_id}"
                    )
                    existing_ids.add(withdrawal_id)
                    migrated += 1
            # -------------------------------------------------
            # Commit only after all records succeed
            # -------------------------------------------------
            conn.commit()
    print()
    print("WITHDRAWALS MIGRATION SUCCESSFUL")
    print(f"MIGRATED WITHDRAWALS: {migrated}")
    print(f"SKIPPED WITHDRAWALS: {skipped}")
    print(f"MISSING HOST WALLETS: {missing_hosts}")
# ---------------------------------------------------------
# Main
# ---------------------------------------------------------
if __name__ == "__main__":
    migrate_withdrawals()