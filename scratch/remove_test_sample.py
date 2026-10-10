import mysql.connector

def remove_test_sample():
    conn = mysql.connector.connect(host='localhost', user='root', password='Manisha@507', database='quelorax_notify')
    cur = conn.cursor()
    cur.execute("DELETE FROM notification_read_by WHERE notification_id IN (SELECT id FROM notifications WHERE message LIKE '%anita.roy%');")
    cur.execute("DELETE FROM notifications WHERE message LIKE '%anita.roy%';" )
    conn.commit()
    cur.execute("SELECT COUNT(*) FROM notifications;")
    print("Test sample removed successfully. Current notification count:", cur.fetchone()[0])
    conn.close()

if __name__ == "__main__":
    remove_test_sample()
