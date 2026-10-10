import mysql.connector

def keep_user_tokens_only():
    conn = mysql.connector.connect(host='localhost', user='root', password='Manisha@507', database='quelorax_queue')
    cur = conn.cursor()

    # Clear all artificial dataset tokens
    cur.execute("TRUNCATE TABLE queue_tokens;")

    # Insert exactly 1 real token for user 4 (Manisha R)
    # (department_id, code, number, user_id, status, priority, walk_in, booking_date, created_at)
    import time
    now = int(time.time() * 1000)

    # 1 token for user 4 (Manisha R)
    cur.execute("""
        INSERT INTO queue_tokens 
        (department_id, code, number, user_id, status, priority, walk_in, booking_date, created_at)
        VALUES (2, 'ACC', 201, 4, 'waiting', 'normal', 0, '2026-08-13', %s);
    """, (now,))

    conn.commit()

    cur.execute("SELECT COUNT(*) FROM queue_tokens WHERE user_id = 4;")
    user4_count = cur.fetchone()[0]
    print(f"User 4 (Manisha R) now has exactly {user4_count} token in database.")
    conn.close()

if __name__ == "__main__":
    keep_user_tokens_only()
