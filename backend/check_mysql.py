import os
import socket
import pymysql

print("Checking port 3306...")
s = socket.socket()
s.settimeout(2)
try:
    s.connect(('localhost', 3306))
    print("Port 3306 is OPEN!")
    s.close()
except Exception as e:
    print(f"Port 3306 is not open or not reachable: {e}")

env_pass = os.getenv("MYSQL_PASSWORD", "")
passwords = [env_pass, "", "root", "password", "123456", "admin", "root123", "root@123", "Root@123"]

for p in passwords:
    try:
        conn = pymysql.connect(host='localhost', port=3306, user='root', password=p, connect_timeout=2)
        print(f"SUCCESS: Connected to MySQL with password: '{p}'")
        with conn.cursor() as cur:
            cur.execute("SHOW DATABASES;")
            dbs = [row[0] for row in cur.fetchall()]
            print("Existing databases:", dbs)
            if 'smart_department_db' not in dbs:
                cur.execute("CREATE DATABASE smart_department_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                print("Created database smart_department_db!")
            else:
                print("Database smart_department_db exists!")
        conn.close()
        break
    except Exception as err:
        pass
else:
    print("Could not connect to MySQL with tested passwords.")
