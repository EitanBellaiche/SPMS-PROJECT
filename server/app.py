from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import sql

app = Flask(__name__)
CORS(app)  # מאפשר בקשות CORS מצד הלקוח

# התחברות ל-PostgreSQL
try:
    db = psycopg2.connect(
        host="dpg-ctspgphu0jms73bck45g-a.frankfurt-postgres.render.com",
        database="spms_database",
        user="spms_database_user",
        password="iGvT2YElFoS9dz4V7Lt1yc6UWO5UKTTx",
        port=5432
    )
    print("Database connected successfully!")
except psycopg2.OperationalError as e:
    print(f"Database connection failed: {e}")
    exit(1)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    try:
        # בדיקת שם משתמש וסיסמה והחזרת role
        cursor = db.cursor()
        query = sql.SQL("SELECT role FROM users WHERE username = %s AND password = %s")
        cursor.execute(query, (username, password))
        user = cursor.fetchone()

        if user:
            role = user[0]  # קבלת התפקיד מתוך התוצאה
            return jsonify({"success": True, "message": "Login successful!", "role": role})
        else:
            return jsonify({"success": False, "message": "Invalid username or password."})
    except psycopg2.Error as e:
        db.rollback()  # מבטל את העסקה הכושלת
        print(f"Database query error: {e}")
        return jsonify({"success": False, "message": "An error occurred while processing your request."})
    finally:
        cursor.close()

if __name__ == '__main__':
    app.run(debug=True)
