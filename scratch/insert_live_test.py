import mysql.connector, time

def test_live():
    conn = mysql.connector.connect(host='localhost', user='root', password='Manisha@507', database='quelorax_queue')
    cur = conn.cursor()
    now = int(time.time()*1000)
    cur.execute("INSERT INTO queue_tokens (department_id, code, number, user_id, status, priority, walk_in, booking_date, created_at) VALUES (1, 'GEN', 999, 4, 'waiting', 'normal', 0, '2026-08-13', %s);", (now,))
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM queue_tokens;")
    count = cur.fetchone()[0]
    print("New MySQL Total Tokens after booking 1 token live:", count)
    conn.close()

if __name__ == "__main__":
    test_live()
