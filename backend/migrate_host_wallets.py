import json
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

with open("host_wallets.json", "r", encoding="utf-8") as f:
    wallets = json.load(f)

print("===== HOST WALLETS MIGRATION =====")
print(f"WALLETS FOUND IN JSON: {len(wallets)}")

conn = psycopg.connect(DATABASE_URL)

try:
    with conn.cursor() as cur:

        cur.execute("SELECT COUNT(*) FROM host_wallets")
        existing_count = cur.fetchone()[0]

        print(f"EXISTING HOST WALLETS IN DATABASE: {existing_count}")

        migrated = 0

        for wallet in wallets:

            host_id = int(wallet["hostId"])

            # hostId 0 represents EventWaa/platform funds.
            # It must not become a host wallet for a fake user 0.
            if host_id == 0:
                print(
                    "SKIPPING hostId=0: EventWaa/platform wallet "
                    "will be migrated separately."
                )
                continue

            cur.execute(
                "SELECT id FROM users WHERE id = %s",
                (host_id,)
            )

            if cur.fetchone() is None:
                print(
                    f"USER NOT FOUND FOR HOST WALLET: {host_id} - "
                    "skipping wallet"
                )
                continue

            cur.execute(
                """
                INSERT INTO host_wallets (
                    user_id,
                    available_balance,
                    pending_balance,
                    total_earned,
                    total_withdrawn,
                    currency,
                    status,
                    created_at,
                    updated_at,
                    metadata
                )
                VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, NOW(), NOW(), %s
                )
                RETURNING id
                """,
                (
                    host_id,
                    wallet.get("availableBalance", 0),
                    wallet.get("pendingPayouts", 0),
                    wallet.get("totalEarned", 0),
                    wallet.get("totalWithdrawn", 0),
                    "UGX",
                    "active",
                    json.dumps({
                        "legacy_host_id": host_id,
                        "legacy_refund_count": wallet.get("refunds", 0),
                        "legacy_scheduled_payouts": wallet.get(
                            "scheduledPayouts", []
                        ),
                        "legacy_withdrawal_record_count": len(
                            wallet.get("withdrawals", [])
                        ),
                        "legacy_transaction_record_count": len(
                            wallet.get("transactions", [])
                        )
                    })
                )
            )

            new_id = cur.fetchone()[0]

            print(
                f"MIGRATED HOST WALLET: "
                f"{new_id} - host {host_id}"
            )

            migrated += 1

        conn.commit()

        print("\nHOST WALLETS MIGRATION SUCCESSFUL")
        print(f"MIGRATED HOST WALLETS: {migrated}")

finally:
    conn.close()
