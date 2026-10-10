import mysql.connector

def clean():
    conn = mysql.connector.connect(host='localhost', user='root', password='Manisha@507', database='quelorax_queue')
    cur = conn.cursor()
    cur.execute("DELETE FROM queue_tokens WHERE number = 999;")
    conn.commit()
    cur.execute("SELECT COUNT(*) FROM queue_tokens;")
    print("Clean Token Count Restored:", cur.fetchone()[0])
    conn.close()

if __name__ == "__main__":
    clean()
