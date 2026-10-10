import mysql.connector
import time

def test_contact_submission():
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='Manisha@507',
        database='quelorax_notify'
    )
    cur = conn.cursor()

    now = int(time.time() * 1000)
    sql = """
    INSERT INTO notifications 
    (user_id, scope, role, type, title, message, created_at)
    VALUES (1, 'org', 'ADMIN', 'contact', %s, %s, %s);
    """
    title = "📩 New Contact Inquiry from Anita Roy"
    body = "Email: anita.roy@gmail.com · Message: We would like to implement Quelorax at our City Health Clinic."

    cur.execute(sql, (title, body, now))
    conn.commit()
    print("Contact inquiry successfully inserted into MySQL quelorax_notify database.")

    cur.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 1;")
    row = cur.fetchone()
    print("Saved Record:", row)
    conn.close()

if __name__ == "__main__":
    test_contact_submission()
