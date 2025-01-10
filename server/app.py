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
        query = sql.SQL("SELECT role, username, profile_picture FROM users WHERE username = %s AND password = %s")
        cursor.execute(query, (username, password))
        user = cursor.fetchone()

        if user:
            return jsonify({
                "success": True,
                "message": "Login successful!",
                "role": user[0],
                "username": user[1],
                "profile_picture": user[2]
            })
        else:
            return jsonify({"success": False, "message": "Invalid username or password."})
    except psycopg2.Error as e:
        db.rollback()
        print(f"Database query error: {e}")
        return jsonify({"success": False, "message": "An error occurred while processing your request."})
    finally:
        cursor.close()

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
        return jsonify({"success": True, "parkingSpots": parking_spots})
    except Exception as e:
        print("Error fetching parking spots:", e)
        return jsonify({"success": False, "error": "Unable to fetch parking spots"}), 500
    finally:
        cursor.close()

@app.route('/parking-spots/<int:spot_id>', methods=['PUT'])
def update_parking_status(spot_id):
    data = request.json
    new_status = data.get("status")

    if new_status not in ["Available", "Occupied"]:
        return jsonify({"success": False, "message": "Invalid status"}), 400

    try:
        cursor = db.cursor()
        query = "UPDATE parking_spots SET status = %s WHERE id = %s"
        cursor.execute(query, (new_status, spot_id))
        db.commit()
        return jsonify({"success": True, "message": "Parking spot updated successfully!"})
    except Exception as e:
        print("Error updating parking spot:", e)
        db.rollback()
        return jsonify({"success": False, "error": "Unable to update parking spot"}), 500
    finally:
        cursor.close()

@app.route('/check-reserved-spot', methods=['POST'])
def check_reserved_spot():
    """
    API לבדיקה אם למשתמש יש כבר חניה שמורה
    """
    data = request.json
    username = data.get("username")

    if not username:
        return jsonify({"success": False, "message": "Username is required"}), 400

    try:
        cursor = db.cursor()
        query = "SELECT reserved_spot FROM users WHERE username = %s"
        cursor.execute(query, (username,))
        result = cursor.fetchone()

        if result and result[0]:
            return jsonify({"success": True, "reservedSpot": result[0]})
        else:
            return jsonify({"success": True, "reservedSpot": None})
    except Exception as e:
        print("Error checking reserved spot:", e)
        return jsonify({"success": False, "error": "Unable to check reserved spot"}), 500
    finally:
        cursor.close()

@app.route('/reserve-spot', methods=['POST'])
def reserve_spot():
    data = request.json
    username = data.get("username")
    spot_id = data.get("spot_id")

    if not username or not spot_id:
        return jsonify({"success": False, "message": "Username and Spot ID are required"}), 400

    try:
        cursor = db.cursor()
        query = "UPDATE users SET reserved_spot = %s WHERE username = %s"
        cursor.execute(query, (spot_id, username))
        db.commit()

        return jsonify({"success": True, "message": f"Spot {spot_id} reserved for user {username}"})
    except Exception as e:
        print("Error reserving spot:", e)
        db.rollback()
        return jsonify({"success": False, "error": "Unable to reserve spot"}), 500
    finally:
        cursor.close()

if __name__ == '__main__':
    app.run(debug=True)
