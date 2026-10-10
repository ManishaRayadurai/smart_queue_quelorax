import mysql.connector
import time

def trim_dataset():
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='Manisha@507',
        database='quelorax_queue'
    )
    cur = conn.cursor()

    cur.execute("TRUNCATE TABLE queue_tokens;")

    now = int(time.time() * 1000)
    one_hour = 3600 * 1000
    one_day = 24 * 3600 * 1000

    # Tokens distributed across users (1: Admin, 4: Manisha R, 5: MounaDharshini V, 6: John Visitor)
    # Each user gets 2-3 clean tokens so Visitor Dashboard looks clean and balanced!
    realistic_tokens = [
        # --- User 4 (Manisha R) ---
        (1, "GEN", 101, 4, "completed", "normal", 0, "2026-08-13", now - 3*one_hour, now - 2*one_hour - 50*60*1000, now - 2*one_hour - 30*60*1000),
        (2, "ACC", 201, 4, "waiting", "normal", 0, "2026-08-13", now - 25*60*1000, None, None),

        # --- User 5 (MounaDharshini V) ---
        (2, "ACC", 202, 5, "completed", "senior", 0, "2026-08-13", now - 4*one_hour, now - 3*one_hour - 40*60*1000, now - 3*one_hour - 15*60*1000),
        (3, "DOC", 301, 5, "waiting", "emergency", 0, "2026-08-13", now - 15*60*1000, None, None),

        # --- User 6 (John Visitor) ---
        (3, "DOC", 302, 6, "completed", "normal", 0, "2026-08-13", now - 2*one_hour, now - 1*one_hour - 45*60*1000, now - 1*one_hour - 20*60*1000),
        (1, "GEN", 102, 6, "waiting", "normal", 0, "2026-08-13", now - 40*60*1000, None, None),

        # --- Additional Department Completed History ---
        (1, "GEN", 100, 1, "completed", "normal", 0, "2026-08-13", now - 5*one_hour, now - 4*one_hour - 45*60*1000, now - 4*one_hour - 20*60*1000),
        (2, "ACC", 200, 1, "completed", "normal", 0, "2026-08-13", now - 4*one_hour - 30*60*1000, now - 3*one_hour - 45*60*1000, now - 3*one_hour - 15*60*1000),
        (3, "DOC", 300, 1, "completed", "normal", 0, "2026-08-13", now - 3*one_hour - 30*60*1000, now - 2*one_hour - 50*60*1000, now - 2*one_hour - 25*60*1000),
        (1, "GEN", 99, 4, "cancelled", "normal", 0, "2026-08-13", now - 6*one_hour, None, None),

        # --- Yesterday's History ---
        (1, "GEN", 98, 4, "completed", "normal", 0, "2026-08-12", now - 1*one_day - 3*one_hour, now - 1*one_day - 2*one_hour - 50*60*1000, now - 1*one_day - 2*one_hour),
        (2, "ACC", 198, 5, "completed", "normal", 0, "2026-08-12", now - 1*one_day - 4*one_hour, now - 1*one_day - 3*one_hour - 40*60*1000, now - 1*one_day - 3*one_hour),
        (3, "DOC", 298, 6, "completed", "normal", 0, "2026-08-12", now - 1*one_day - 5*one_hour, now - 1*one_day - 4*one_hour - 30*60*1000, now - 1*one_day - 4*one_hour),
    ]

    sql = """
    INSERT INTO queue_tokens 
    (department_id, code, number, user_id, status, priority, walk_in, booking_date, created_at, called_at, completed_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """

    cur.executemany(sql, realistic_tokens)
    conn.commit()
    print(f"Successfully updated database with {len(realistic_tokens)} clean balanced tokens.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    trim_dataset()
