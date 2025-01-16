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
        
        
@app.route('/cancel-reservation', methods=['POST'])
def cancel_reservation():
    """
    API לביטול חנייה שמורה מטבלת reservations
    """
    data = request.json
    username = data.get("username")
    reservation_date = data.get("reservation_date")

    if not username or not reservation_date:
        return jsonify({"success": False, "message": "Username and Reservation Date are required"}), 400

    try:
        cursor = db.cursor()

        # מחיקת ההזמנה מטבלת reservations
        query_delete_reservation = """
            DELETE FROM reservations 
            WHERE username = %s AND reservation_date = %s
        """
        cursor.execute(query_delete_reservation, (username, reservation_date))
        db.commit()

        # בדיקה אם נמחקה רשומה
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "No reservation found to cancel"}), 404

        return jsonify({"success": True, "message": "Reservation cancelled successfully!"})
    except Exception as e:
        print("Error cancelling reservation:", e)
        db.rollback()
        return jsonify({"success": False, "error": "Unable to cancel reservation"}), 500
    finally:
        cursor.close()

@app.route('/check-availability', methods=['POST'])
def check_availability():
    """
    API לבדיקה אם מקום חניה פנוי בתאריך מסוים
    """
    data = request.json
    spot_id = data.get("spot_id")
    reservation_date = data.get("reservation_date")

    if not spot_id or not reservation_date:
        return jsonify({"success": False, "message": "Spot ID and Reservation Date are required"}), 400

    try:
        cursor = db.cursor()
        query = """
            SELECT 1
            FROM reservations
            WHERE parking_spot_id = %s AND reservation_date = %s
        """
        cursor.execute(query, (spot_id, reservation_date))
        result = cursor.fetchone()

        if result:
            return jsonify({"success": True, "available": False})
        else:
            return jsonify({"success": True, "available": True})
    except Exception as e:
        print("Error checking availability:", e)
        return jsonify({"success": False, "error": "Unable to check availability"}), 500
    finally:
        cursor.close()


@app.route('/reserve-spot-date', methods=['POST'])
def reserve_spot_date():
    """
    API להזמנת מקום חניה בתאריך מסוים
    """
    data = request.json
    username = data.get("username")
    spot_id = data.get("spot_id")
    reservation_date = data.get("reservation_date")

    if not username or not spot_id or not reservation_date:
        return jsonify({"success": False, "message": "Username, Spot ID, and Reservation Date are required"}), 400

    try:
        cursor = db.cursor()

        # בדיקה אם החניה כבר מוזמנת בתאריך זה
        check_query = """
            SELECT 1 FROM reservations
            WHERE parking_spot_id = %s AND reservation_date = %s
        """
        cursor.execute(check_query, (spot_id, reservation_date))
        result = cursor.fetchone()

        if result:
            return jsonify({"success": False, "message": "Parking spot is already reserved for this date"}), 409

        # הוספת ההזמנה אם החניה פנויה
        insert_query = """
            INSERT INTO reservations (parking_spot_id, username, reservation_date, status)
            VALUES (%s, %s, %s, 'Reserved')
        """
        cursor.execute(insert_query, (spot_id, username, reservation_date))
        db.commit()

        return jsonify({"success": True, "message": f"Spot {spot_id} reserved for {reservation_date}"})
    except Exception as e:
        print("Error reserving spot:", e)
        db.rollback()
        return jsonify({"success": False, "error": "Unable to reserve spot"}), 500
    finally:
        cursor.close()
        
@app.route('/user-reservations', methods=['GET'])
def get_user_reservations():
    """
    API לשליפת כל ההזמנות של המשתמש
    """
    username = request.args.get("username")

    if not username:
        return jsonify({"success": False, "message": "Username is required"}), 400

    try:
        cursor = db.cursor()
        query = """
            SELECT parking_spot_id, reservation_date, status 
            FROM reservations 
            WHERE username = %s
        """
        cursor.execute(query, (username,))
        rows = cursor.fetchall()
        reservations = [
            {"spot_id": row[0], "reservation_date": row[1], "status": row[2]} for row in rows
        ]
        return jsonify({"success": True, "reservations": reservations})
    except Exception as e:
        print("Error fetching user reservations:", e)
        return jsonify({"success": False, "error": "Unable to fetch reservations"}), 500
    finally:
        cursor.close()
@app.route('/parking-spots-by-date', methods=['GET'])
def get_parking_spots_by_date():
    reservation_date = request.args.get("reservation_date")

    if not reservation_date:
        return jsonify({"success": False, "message": "Reservation date is required"}), 400

    try:
        cursor = db.cursor()
        query = """
            SELECT ps.id, ps.spot_code, ps.level, 
                   CASE 
                       WHEN r.id IS NOT NULL THEN 'Occupied' 
                       ELSE 'Available' 
                   END AS status,
                   CASE
                       WHEN ps.level = 1 THEN TRUE
                       ELSE FALSE
                   END AS isRecommended
            FROM parking_spots ps
            LEFT JOIN reservations r
            ON ps.id = r.parking_spot_id AND r.reservation_date = %s
        """
        cursor.execute(query, (reservation_date,))
        rows = cursor.fetchall()
        parking_spots = [
            {"id": row[0], "spot_code": row[1], "level": row[2], "status": row[3], "isRecommended": row[4]} for row in rows
        ]
        return jsonify({"success": True, "parkingSpots": parking_spots})
    except Exception as e:
        print("Error fetching parking spots by date:", e)
        return jsonify({"success": False, "error": "Unable to fetch parking spots"}), 500
    finally:
        cursor.close()


@app.route('/delete-reservation', methods=['POST'])
def delete_reservation():
    """
    API למחיקת חניה מטבלת reservations על בסיס spot_id ו-reservation_date
    """
    data = request.json
    spot_id = data.get("spot_id")
    reservation_date = data.get("reservation_date")

    if not spot_id or not reservation_date:
        return jsonify({"success": False, "message": "Spot ID and Reservation Date are required"}), 400

    try:
        cursor = db.cursor()

        # מחיקת ההזמנה מטבלת reservations
        query_delete_reservation = """
            DELETE FROM reservations 
            WHERE parking_spot_id = %s AND reservation_date = %s
        """
        cursor.execute(query_delete_reservation, (spot_id, reservation_date))
        db.commit()

        # בדיקה אם נמחקה רשומה
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "No reservation found to delete"}), 404

        return jsonify({"success": True, "message": "Reservation deleted successfully!"})
    except Exception as e:
        print("Error deleting reservation:", e)
        db.rollback()
        return jsonify({"success": False, "error": "Unable to delete reservation"}), 500
    finally:
        cursor.close()

@app.route('/recommend-parking', methods=['GET'])
def recommend_parking():
    """
    API לחיפוש חניה מומלצת לפי מבנה ורמת חניה
    """
    username = request.args.get('username')
    reservation_date = request.args.get('reservation_date')

    if not username or not reservation_date:
        return jsonify({"success": False, "message": "Username and reservation date are required"}), 400

    try:
        cursor = db.cursor()

        # שליפת פרטי המשתמש
        cursor.execute("SELECT building FROM users WHERE username = %s", (username,))
        user_data = cursor.fetchone()
        if not user_data:
            return jsonify({"success": False, "message": "User not found"}), 404

        user_building = user_data[0]

        # מיפוי בין מבנים לרמות חניה
        building_to_level = {
            "A": 1,  # מבנה A -> רמה 1
            "B": 2   # מבנה B -> רמה 2
        }

        # רמת החניה המועדפת על פי המבנה
        preferred_level = building_to_level.get(user_building)

        # שליפת חניות פנויות בתאריך המבוקש
        query = """
            SELECT ps.id, ps.spot_code, ps.level
            FROM parking_spots ps
            LEFT JOIN reservations r
            ON ps.id = r.parking_spot_id AND r.reservation_date = %s
            WHERE ps.status = 'Available' AND r.id IS NULL
            ORDER BY
                CASE
                    WHEN ps.level = %s THEN 0  -- העדפה לרמה תואמת למבנה
                    ELSE 1
                END, ps.id ASC
            LIMIT 1
        """
        cursor.execute(query, (reservation_date, preferred_level))
        recommended_spot = cursor.fetchone()

        if recommended_spot:
            return jsonify({
                "success": True,
                "recommendedSpot": {
                    "id": recommended_spot[0],
                    "spot_code": recommended_spot[1],
                    "level": recommended_spot[2]
                }
            })
        else:
            return jsonify({"success": False, "message": "No available parking spots"}), 404
    except Exception as e:
        print(f"Error recommending parking spot: {e}")
        return jsonify({"success": False, "error": "Unable to recommend parking spot"}), 500
    finally:
        cursor.close()


if __name__ == '__main__':
    app.run(debug=True)
