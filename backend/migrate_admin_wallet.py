import json
import os
import psycopg
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")
with open("wallet.json", "r", encoding="utf-8") as f:
    wallet = json.load(f)
print("===== ADMIN WALLET MIGRATION =====")
print("LEGACY PLATFORM WALLET FOUND")
print(
    f"LEGACY SALE TRANSACTIONS: "
    f"{len(wallet.get('transactions', []))}"
)
print(
    f"LEGACY WITHDRAWALS: "
    f"{len(wallet.get('withdrawals', []))}"
)
conn = psycopg.connect(DATABASE_URL)
try:
    with conn.cursor() as cur:
        # Check whether an admin wallet already exists.
        cur.execute("SELECT COUNT(*) FROM admin_wallet")
        existing_wallet_count = cur.fetchone()[0]
        print(
            f"EXISTING ADMIN WALLETS IN DATABASE: "
            f"{existing_wallet_count}"
        )
        if existing_wallet_count > 0:
            raise RuntimeError(
                "Admin wallet already exists. "
                "Migration stopped to prevent duplication."
            )
        # ---------------------------------------------------------
        # Migrate the single EventWaa platform wallet.
        #
        # total_commission and total_service_fees do not have
        # dedicated columns in admin_wallet. They are preserved
        # inside metadata.
        # ---------------------------------------------------------
        cur.execute(
            """
            INSERT INTO admin_wallet (
                available_balance,
                pending_balance,
                total_revenue,
                total_withdrawn,
                currency,
                status,
                created_at,
                updated_at,
                metadata
            )
            VALUES (
                %s, %s, %s, %s,
                %s, %s, NOW(), NOW(), %s
            )
            RETURNING id
            """,
            (
                wallet.get("availableBalance", 0),
                wallet.get("pendingPayouts", 0),
                wallet.get("totalRevenue", 0),
                wallet.get("totalWithdrawn", 0),
                "UGX",
                "active",
                json.dumps(
                    {
                        "legacy_wallet_type": "platform",
                        "legacy_source": "wallet.json",
                        "legacy_total_commission": wallet.get(
                            "totalCommission", 0
                        ),
                        "legacy_total_service_fees": wallet.get(
                            "totalServiceFees", 0
                        ),
                        "legacy_sale_transaction_count": len(
                            wallet.get("transactions", [])
                        ),
                        "legacy_withdrawal_count": len(
                            wallet.get("withdrawals", [])
                        ),
                        "legacy_summary": {
                            "availableBalance": wallet.get(
                                "availableBalance", 0
                            ),
                            "pendingPayouts": wallet.get(
                                "pendingPayouts", 0
                            ),
                            "totalCommission": wallet.get(
                                "totalCommission", 0
                            ),
                            "totalServiceFees": wallet.get(
                                "totalServiceFees", 0
                            ),
                            "totalRevenue": wallet.get(
                                "totalRevenue", 0
                            ),
                            "totalWithdrawn": wallet.get(
                                "totalWithdrawn", 0
                            )
                        },
                        "legacy_transaction_totals": {
                            "transaction_count": len(
                                wallet.get("transactions", [])
                            ),
                            "subtotal": sum(
                                float(
                                    transaction.get(
                                        "subtotal", 0
                                    )
                                )
                                for transaction in wallet.get(
                                    "transactions", []
                                )
                            ),
                            "commission": sum(
                                float(
                                    transaction.get(
                                        "commission", 0
                                    )
                                )
                                for transaction in wallet.get(
                                    "transactions", []
                                )
                            ),
                            "service_fee": sum(
                                float(
                                    transaction.get(
                                        "serviceFee", 0
                                    )
                                )
                                for transaction in wallet.get(
                                    "transactions", []
                                )
                            ),
                            "platform_amount": sum(
                                float(
                                    transaction.get(
                                        "amount", 0
                                    )
                                )
                                for transaction in wallet.get(
                                    "transactions", []
                                )
                            )
                        }
                    }
                )
            )
        )
        admin_wallet_id = cur.fetchone()[0]
        conn.commit()
        print(
            f"MIGRATED ADMIN WALLET: "
            f"{admin_wallet_id}"
        )
        print("")
        print("ADMIN WALLET MIGRATION SUCCESSFUL")
finally:
    conn.close()