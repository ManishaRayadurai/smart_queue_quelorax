import mysql.connector
import random
from datetime import datetime, timedelta

def seed_dataset():
    print("Connecting to MySQL quelorax_queue...")
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Manisha@507",
        database="quelorax_queue"
    )
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id, name, code, avg_service_time FROM departments;")
    depts = cursor.fetchall()
    
    if not depts:
        print("No departments found. Seeding default departments...")
        dept_data = [
            (b'\x01', 8, "GEN", 1, "General Medicine"),
            (b'\x01', 12, "CARD", 2, "Cardiology"),
            (b'\x01', 15, "ORTHO", 3, "Orthopedics"),
            (b'\x01', 4, "BILL", 4, "Billing & Registration")
        ]
        cursor.executemany(
            "INSERT INTO departments (active, avg_service_time, code, counter, name) VALUES (%s, %s, %s, %s, %s);",
            dept_data
        )
        conn.commit()
        cursor.execute("SELECT id, name, code, avg_service_time FROM departments;")
        depts = cursor.fetchall()

    print(f"Found {len(depts)} active departments.")

    print("Generating 5,000 realistic token dataset records...")
    now = datetime.now()
    start_date = now - timedelta(days=60)

    priorities = ["normal", "senior", "emergency", "vip"]
    priority_weights = [0.70, 0.18, 0.07, 0.05]
    statuses = ["completed", "completed", "completed", "completed", "cancelled", "skipped"]

    records = []
    names = ["Aarav Sharma", "Priya Nair", "Rahul Verma", "Ananya Patel", "Vikram Singh", "Sanya Gupta", "Karthik Raja", "Deepa Mohan"]

    for i in range(1, 5001):
        day_offset = random.randint(0, 60)
        hour = random.choices(
            [8, 9, 10, 10, 11, 11, 12, 13, 14, 14, 15, 15, 16, 17],
            [3, 6, 12, 14, 12, 10, 6,  4,  10, 12, 10,  8,  5,  2]
        )[0]
        minute = random.randint(0, 59)
        second = random.randint(0, 59)

        booking_dt = start_date + timedelta(days=day_offset, hours=hour, minutes=minute, seconds=second)
        created_ts = int(booking_dt.timestamp() * 1000)

        dept = random.choice(depts)
        dept_id = dept['id']
        dept_code = dept['code'] or f"D{dept_id}"
        avg_svc = dept.get('avg_service_time') or 8

        priority = random.choices(priorities, priority_weights)[0]
        status = random.choice(statuses)

        peak_factor = 1.8 if hour in [10, 11, 14, 15] else 1.0
        base_wait = random.randint(3, 12) * peak_factor

        if priority == "emergency":
            wait_mins = random.randint(1, 3)
        elif priority == "vip":
            wait_mins = random.randint(2, 5)
        elif priority == "senior":
            wait_mins = max(2, int(base_wait * 0.5))
        else:
            wait_mins = max(3, int(base_wait))

        svc_duration_mins = max(2, int(random.gauss(avg_svc, 2)))

        called_ts = created_ts + (wait_mins * 60 * 1000)
        completed_ts = called_ts + (svc_duration_mins * 60 * 1000)

        token_code = f"{dept_code}-{1000 + i}"
        token_num = i
        booking_date = booking_dt.strftime("%Y-%m-%d")
        booking_time = booking_dt.strftime("%I:%M %p")
        visitor_name = random.choice(names)
        phone = f"98{random.randint(10000000, 99999999)}"
        purpose = "General Consultation"
        walk_in = b'\x00'

        records.append((
            token_code, token_num, dept_id, 1, visitor_name, phone, purpose,
            priority, status, walk_in, created_ts, called_ts, completed_ts,
            booking_date, booking_time
        ))

    insert_query = """
    INSERT INTO queue_tokens 
    (code, number, department_id, user_id, visitor_name, phone, purpose, priority, status, walk_in, created_at, called_at, completed_at, booking_date, booking_time)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    batch_size = 500
    for i in range(0, len(records), batch_size):
        cursor.executemany(insert_query, records[i:i + batch_size])
        conn.commit()

    cursor.execute("SELECT COUNT(*) AS total FROM queue_tokens;")
    count_res = cursor.fetchone()
    print(f"Seeding completed! Total records in queue_tokens: {count_res['total']}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    seed_dataset()
