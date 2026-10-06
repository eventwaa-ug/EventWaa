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
        cur.execute(
            """
            SELECT
                column_name,
                data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'payments'
            ORDER BY ordinal_position
            """
        )

        columns = cur.fetchall()

        print("===== PAYMENTS SCHEMA =====")

        for column in columns:
            print(column)

finally:
    conn.close()