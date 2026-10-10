import mysql.connector

def check():
    conn_auth = mysql.connector.connect(host='localhost', user='root', password='Manisha@507', database='quelorax_auth')
    cur_auth = conn_auth.cursor(dictionary=True)
    cur_auth.execute('SELECT COUNT(*) AS total_users FROM users;')
    total_users = cur_auth.fetchone()['total_users']

    cur_auth.execute('SELECT SUM(login_count) AS total_logins FROM users;')
    total_logins = cur_auth.fetchone()['total_logins']

    conn_q = mysql.connector.connect(host='localhost', user='root', password='Manisha@507', database='quelorax_queue')
    cur_q = conn_q.cursor(dictionary=True)
    cur_q.execute('SELECT COUNT(*) AS total_depts FROM departments;')
    total_depts = cur_q.fetchone()['total_depts']

    cur_q.execute('SELECT COUNT(*) AS total_tokens FROM queue_tokens;')
    total_tokens = cur_q.fetchone()['total_tokens']

    cur_q.execute("SELECT COUNT(*) AS completed_tokens FROM queue_tokens WHERE status = 'completed';")
    completed_tokens = cur_q.fetchone()['completed_tokens']

    print('=== DYNAMIC MYSQL DATABASE READINGS ===')
    print('MySQL Total Users:', total_users)
    print('MySQL Total Departments:', total_depts)
    print('MySQL Total Tokens:', total_tokens)
    print('MySQL Completed Tokens:', completed_tokens)
    print('MySQL Completion Rate:', f'{round((completed_tokens/total_tokens)*100)}%' if total_tokens else '0%')
    print('MySQL Total Logins Sum:', total_logins)

if __name__ == "__main__":
    check()
