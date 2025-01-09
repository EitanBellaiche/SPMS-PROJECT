from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import sql

app = Flask(__name__)
CORS(app)

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
        cursor = db.cursor()
        query = sql.SQL("SELECT role, username FROM users WHERE username = %s AND password = %s")
        cursor.execute(query, (username, password))
        user = cursor.fetchone()

        if user:
            role = user[0]
            username = user[1]
            return jsonify({"success": True, "message": "Login successful!", "role": role, "username": username})
        else:
            return jsonify({"success": False, "message": "Invalid username or password."})
    except psycopg2.Error as e:
        db.rollback()
        print(f"Database query error: {e}")
        return jsonify({"success": False, "message": "An error occurred while processing your request."})
    finally:
        cursor.close()

# API לשליפת שם המשתמש
@app.route('/user-data', methods=['GET'])
def get_user_data():
    username = request.args.get('username')  # מקבל את שם המשתמש
    try:
        cursor = db.cursor()
        query = sql.SQL("SELECT username FROM users WHERE username = %s")
        cursor.execute(query, (username,))
        user = cursor.fetchone()
        if user:
            return jsonify({
                "success": True,
                "username": user[0]
            })
        else:
            return jsonify({"success": False, "message": "User not found"}), 404
    except Exception as e:
        print("Error fetching user data:", e)
        return jsonify({"error": "Unable to fetch user data"}), 500
    finally:
        cursor.close()

# API לשליפת החניות
@app.route('/parking-spots', methods=['GET'])
def get_parking_spots():
    try:
        cursor = db.cursor()
        query = "SELECT id, spot_code, level, status FROM parking_spots"
        cursor.execute(query)
        rows = cursor.fetchall()
        parking_spots = [
            {"id": row[0], "spot_code": row[1], "level": row[2], "status": row[3]} for row in rows
        ]
        return jsonify({"parkingSpots": parking_spots})
    except Exception as e:
        print("Error fetching parking spots:", e)
        return jsonify({"error": "Unable to fetch parking spots"}), 500

# API לעדכון סטטוס החניה
@app.route('/parking-spots/<int:spot_id>', methods=['PUT'])
def update_parking_status(spot_id):
    data = request.json
    new_status = data.get("status")
    try:
        cursor = db.cursor()
        query = "UPDATE parking_spots SET status = %s WHERE id = %s"
        cursor.execute(query, (new_status, spot_id))
        db.commit()
        return jsonify({"success": True, "message": "Parking spot updated successfully!"})
    except Exception as e:
        print("Error updating parking spot:", e)
        db.rollback()
        return jsonify({"error": "Unable to update parking spot"}), 500

if __name__ == '__main__':
    app.run(debug=True)
