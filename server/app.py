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
    reservation_date = request.args.get("reservation_date")
    start_time = request.args.get("start_time")
    end_time = request.args.get("end_time")

    if not reservation_date or not start_time or not end_time:
        return jsonify({"success": False, "message": "Date and time range are required"}), 400

    try:
        cursor = db.cursor()
        query = """
            SELECT ps.id, ps.spot_code, ps.level,
                   CASE 
                       WHEN EXISTS (
                           SELECT 1 FROM reservations r
                           WHERE r.parking_spot_id = ps.id
                           AND r.reservation_date = %s
                           AND (r.start_time < %s AND r.end_time > %s)
                       ) THEN 'Occupied' 
                       ELSE 'Available' 
                   END AS status
            FROM parking_spots ps
        """
        cursor.execute(query, (reservation_date, end_time, start_time))
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
    data = request.json
    username = data.get("username")
    reservation_date = data.get("reservation_date")
   

    if not username or not reservation_date:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    try:
        cursor = db.cursor()
        query_delete_reservation = """
            DELETE FROM reservations 
            WHERE username = %s AND reservation_date = %s 
        """
        cursor.execute(query_delete_reservation, (username, reservation_date))
        db.commit()

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
    API לבדיקה אם מקום חניה פנוי בתאריך ושעות מסוימים
    """
    data = request.json
    spot_id = data.get("spot_id")
    reservation_date = data.get("reservation_date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")

    if not spot_id or not reservation_date or not start_time or not end_time:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    try:
        cursor = db.cursor()
        query = """
            SELECT 1
            FROM reservations
            WHERE parking_spot_id = %s 
            AND reservation_date = %s
            AND (start_time < %s AND end_time > %s)
        """
        cursor.execute(query, (spot_id, reservation_date, end_time, start_time))
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


def is_valid_time_format(time):
    try:
        hours, minutes = map(int, time.split(":"))
        return 0 <= hours < 24 and minutes in {0, 30}
    except ValueError:
        return False

@app.route('/reserve-spot-date', methods=['POST'])
def reserve_spot_date():
    """
    API להזמנת מקום חניה בתאריך מסוים עם שעות התחלה וסיום
    """
    data = request.json

    # קבלת נתונים מהבקשה
    username = data.get("username")
    spot_id = data.get("spot_id")
    reservation_date = data.get("reservation_date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")

    # בדיקה שהשדות הנדרשים קיימים
    if not username or not spot_id or not reservation_date or not start_time or not end_time:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    # בדיקה שפורמט השעה חוקי
    if not is_valid_time_format(start_time) or not is_valid_time_format(end_time):
        return jsonify({"success": False, "message": "Time must be in 30-minute intervals"}), 400

    try:
        cursor = db.cursor()

        # בדיקה אם החניה כבר מוזמנת בשעות האלו
        check_query = """
            SELECT 1 FROM reservations
            WHERE parking_spot_id = %s AND reservation_date = %s
            AND (start_time < %s AND end_time > %s)
        """
        cursor.execute(check_query, (spot_id, reservation_date, end_time, start_time))
        result = cursor.fetchone()

        if result:
            return jsonify({"success": False, "message": "Parking spot is already reserved for this time"}), 409

        # הוספת ההזמנה אם החניה פנויה
        insert_query = """
            INSERT INTO reservations (parking_spot_id, username, reservation_date, start_time, end_time, status)
            VALUES (%s, %s, %s, %s, %s, 'Reserved')
        """
        cursor.execute(insert_query, (spot_id, username, reservation_date, start_time, end_time))
        db.commit()

        return jsonify({"success": True, "message": f"Spot {spot_id} reserved successfully for {reservation_date} from {start_time} to {end_time}"})
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
@app.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    """
    API להרשמה - הכנסת משתמש חדש לבסיס הנתונים
    """
    if request.method == 'OPTIONS':
        # מענה לבקשת OPTIONS
        return jsonify({'status': 'OK'}), 200

    data = request.json
    id = data.get('id')
    username = data.get('username')
    password = data.get('password')
    building = data.get('building')

    if not id or not username or not password or not building:
        return jsonify({"success": False, "message": "fill all"}), 400

    try:
        cursor = db.cursor()

        # בדיקה אם המשתמש כבר קיים
        check_query = "SELECT * FROM users WHERE username = %s OR id = %s"
        cursor.execute(check_query, (username, id))
        if cursor.fetchone():
            return jsonify({"success": False, "message":  "user already exist"}), 409

        # הוספת המשתמש החדש
        insert_query = """
            INSERT INTO users (id, username, password, building, role)
            VALUES (%s, %s, %s, %s, 'user')
        """
        cursor.execute(insert_query, (id, username, password, building))
        db.commit()

        return jsonify({"success": True, "message": "your sing up sucssesfuly"})

    except psycopg2.Error as e:
        db.rollback()
        print(f"Database error during signup: {e}")
        return jsonify({"success": False, "message": "Error"}), 500
    finally:
        cursor.close()

if __name__ == '__main__':
    app.run(debug=True)

