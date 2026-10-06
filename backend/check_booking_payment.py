import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg.connect(DATABASE_URL)

with conn.cursor() as cur:
    cur.execute("""
        SELECT
            id,
            tx_ref,
            transaction_id,
            provider_response
        FROM payments
        WHERE transaction_id = '10460840'
    """)

    row = cur.fetchone()

    if row:
        print("PAYMENT ID:", row[0])
        print("TX REF:", row[1])
        print("TRANSACTION ID:", row[2])
        print("PROVIDER RESPONSE:")
        print(row[3])

conn.close()