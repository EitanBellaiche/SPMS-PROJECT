from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2 import sql
import os  # לשימוש במשתני סביבה
from datetime import datetime, date, time, timedelta

app = Flask(__name__, static_folder="client/build")  
CORS(app, resources={r"/*": {"origins": "*"}})

try:
    db = psycopg2.connect(
        host=os.getenv("DB_HOST", "dpg-ctspgphu0jms73bck45g-a.frankfurt-postgres.render.com"),
        database=os.getenv("DB_NAME", "spms_database"),
        user=os.getenv("DB_USER", "spms_database_user"),
        password=os.getenv("DB_PASSWORD", "iGvT2YElFoS9dz4V7Lt1yc6UWO5UKTTx"),
        port=os.getenv("DB_PORT", 5432),
        sslmode="require"  # חובה להשתמש ב-SSL
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
    username = request.args.get("username")  # קבלת שם המשתמש

    if not reservation_date or not start_time or not end_time or not username:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    try:
        cursor = db.cursor()

        # שליפת הצרכים של המשתמש
        user_query = """
            SELECT is_electric_car, is_disabled_user
            FROM users
            WHERE username = %s
        """
        cursor.execute(user_query, (username,))
        user_preferences = cursor.fetchone()

        is_electric_car = user_preferences[0]
        is_disabled_user = user_preferences[1]

        # שאילתה מותאמת לצרכי המשתמש
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
                   END AS status,
                   ps.is_electric,
                   ps.is_disabled
            FROM parking_spots ps
            WHERE ps.status = 'Available'
              AND (
                  (%s = TRUE AND ps.is_electric = TRUE) OR  -- חניות חשמליות אם המשתמש עם רכב חשמלי
                  (%s = TRUE AND ps.is_disabled = TRUE) OR  -- חניות לנכים אם המשתמש נכה
                  (ps.is_electric = FALSE AND ps.is_disabled = FALSE)  -- חניות רגילות
              )
            ORDER BY ps.id ASC
        """
        cursor.execute(query, (reservation_date, end_time, start_time, is_electric_car, is_disabled_user))
        rows = cursor.fetchall()

        parking_spots = [
            {
                "id": row[0],
                "spot_code": row[1],
                "level": row[2],
                "status": row[3],
                "is_electric": row[4],
                "is_disabled": row[5],
            }
            for row in rows
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

        return jsonify({"success": True, "message": f"Spot reserved successfully for {reservation_date} from {start_time} to {end_time}"})
    except Exception as e:
        print("Error reserving spot:", e)
        db.rollback()
        return jsonify({"success": False, "error": "Unable to reserve spot"}), 500
    finally:
        cursor.close()
@app.route('/user-reservations', methods=['GET'])
def get_user_reservations():
    username = request.args.get("username")

    if not username:
        return jsonify({"success": False, "message": "Username is required"}), 400

    cursor = None  # הוספת משתנה לפני שימוש בו

    try:
        cursor = db.cursor()
        query = """
            SELECT r.id, r.parking_spot_id, ps.spot_code, r.reservation_date, 
                   r.start_time, r.end_time, ps.latitude, ps.longitude, r.status
            FROM reservations r
            JOIN parking_spots ps ON r.parking_spot_id = ps.id
            WHERE r.username = %s
            ORDER BY r.reservation_date DESC
        """
        cursor.execute(query, (username,))
        rows = cursor.fetchall()

        print("Fetched reservations:", rows)  

        reservations = [
            {
                "id": row[0],
                "spot_id": row[1],
                "spot_code": row[2],
                "reservation_date": row[3].strftime("%Y-%m-%d") if isinstance(row[3], date) else row[3],  
                "start_time": row[4].strftime("%H:%M:%S") if isinstance(row[4], time) else row[4],  
                "end_time": row[5].strftime("%H:%M:%S") if isinstance(row[5], time) else row[5],  
                "latitude": row[6],
                "longitude": row[7],
                "status": row[8]
            }
            for row in rows
        ]

        return jsonify({"success": True, "reservations": reservations})

    except Exception as e:
        print(f"Error fetching reservations: {e}") 
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if cursor:  # בדיקה שה-cursor לא ריק לפני סגירתו
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
    API לחיפוש חניה מומלצת לפי מבנה, רמת חניה וצרכים מיוחדים
    """
    username = request.args.get('username')
    reservation_date = request.args.get('reservation_date')

    if not username or not reservation_date:
        return jsonify({"success": False, "message": "Username and reservation date are required"}), 400

    try:
        cursor = db.cursor()

        # שליפת פרטי המשתמש
        cursor.execute("""
            SELECT building, is_electric_car, is_disabled_user 
            FROM users 
            WHERE username = %s
        """, (username,))
        user_data = cursor.fetchone()

        if not user_data:
            return jsonify({"success": False, "message": "User not found"}), 404

        user_building, is_electric_car, is_disabled_user = user_data

        # מיפוי בין מבנים לרמות חניה
        building_to_level = {
            "A": 1,  # מבנה A -> רמה 1
            "B": 2   # מבנה B -> רמה 2
        }

        # רמת החניה המועדפת על פי המבנה
        preferred_level = building_to_level.get(user_building)

        # שאילתה למשתמשים עם צרכים מיוחדים
        query = """
            SELECT ps.id, ps.spot_code, ps.level
            FROM parking_spots ps
            LEFT JOIN reservations r
            ON ps.id = r.parking_spot_id AND r.reservation_date = %s
            WHERE ps.status = 'Available' 
              AND r.id IS NULL
              AND (
                  (%s = TRUE AND ps.is_electric = TRUE) OR  -- חניות חשמליות
                  (%s = TRUE AND ps.is_disabled = TRUE) OR  -- חניות לנכים
                  (ps.is_electric = FALSE AND ps.is_disabled = FALSE)  -- חניות רגילות
              )
            ORDER BY
                CASE
                    WHEN ps.is_electric = TRUE THEN 0  -- חניות חשמליות
                    WHEN ps.is_disabled = TRUE THEN 1  -- חניות לנכים
                    WHEN ps.level = %s THEN 2         -- התאמה לרמת המבנה
                    ELSE 3                            -- כל השאר
                END, ps.id ASC
            LIMIT 1
        """
        cursor.execute(query, (reservation_date, is_electric_car, is_disabled_user, preferred_level))
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

@app.route('/reserve-future-parking', methods=['POST'])
def reserve_future_parking():
    """
    API להזמנת חניות חוזרות עם חניות חלופיות במקרה הצורך
    """
    data = request.json

    username = data.get("username")
    selected_days = data.get("selectedDays")  # ['Monday', 'Wednesday']
    start_time = data.get("startTime")  # לדוגמה: '13:00'
    end_time = data.get("endTime")  # לדוגמה: '17:00'
    reservation_duration = int(data.get("reservationDuration", 0))  # מספר שבועות

    if not username or not selected_days or not start_time or not end_time or reservation_duration <= 0:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    try:
        cursor = db.cursor()

        # שליפת פרטי המשתמש
        cursor.execute("""
            SELECT is_electric_car, is_disabled_user 
            FROM users 
            WHERE username = %s
        """, (username,))
        user_data = cursor.fetchone()

        if not user_data:
            return jsonify({"success": False, "message": "User not found"}), 404

        is_electric_car, is_disabled_user = user_data

        # יצירת רשימת תאריכים לכל הימים הנבחרים
        start_date = datetime.now().date()
        end_date = start_date + timedelta(weeks=reservation_duration)
        reservation_dates = []

        while start_date <= end_date:
            if start_date.strftime("%A") in selected_days:
                reservation_dates.append(start_date)
            start_date += timedelta(days=1)

        # שמירת ההזמנות
        reservations = []
        unavailable_dates = []

        for date in reservation_dates:
            # ניסיון למצוא חנייה מומלצת תחילה
            recommend_query = """
                SELECT ps.id 
                FROM parking_spots ps
                LEFT JOIN reservations r
                ON ps.id = r.parking_spot_id AND r.reservation_date = %s
                WHERE ps.status = 'Available' 
                  AND r.id IS NULL
                  AND (
                      (%s = TRUE AND ps.is_electric = TRUE) OR
                      (%s = TRUE AND ps.is_disabled = TRUE) OR
                      (ps.is_electric = FALSE AND ps.is_disabled = FALSE)
                  )
                ORDER BY 
                    CASE 
                        WHEN ps.is_electric = TRUE THEN 0
                        WHEN ps.is_disabled = TRUE THEN 1
                        ELSE 2
                    END, ps.id ASC
                LIMIT 1
            """
            cursor.execute(recommend_query, (date, is_electric_car, is_disabled_user))
            recommended_spot = cursor.fetchone()

            if recommended_spot:
                spot_id = recommended_spot[0]
            else:
                # אין חנייה פנויה ליום הזה
                unavailable_dates.append(str(date))
                continue

            # בדיקה אם החנייה פנויה בשעות האלו
            check_query = """
                SELECT 1 FROM reservations
                WHERE parking_spot_id = %s
                AND reservation_date = %s
                AND (start_time < %s AND end_time > %s)
            """
            cursor.execute(check_query, (spot_id, date, end_time, start_time))
            if cursor.fetchone():
                unavailable_dates.append(str(date))
                continue

            # שמירת החנייה
            insert_query = """
                INSERT INTO reservations (parking_spot_id, username, reservation_date, start_time, end_time, status)
                VALUES (%s, %s, %s, %s, %s, 'Reserved')
            """
            cursor.execute(insert_query, (spot_id, username, date, start_time, end_time))
            reservations.append({"date": date, "spot_id": spot_id})

        db.commit()

        if unavailable_dates:
            return jsonify({
                "success": True,
                "message": "Partial reservations completed. Some dates were unavailable.",
                "unavailableDates": unavailable_dates,
                "reservations": reservations
            })

        return jsonify({"success": True, "message": "Future parking reservations were successfully made!", "reservations": reservations})

    except Exception as e:
        print("Error reserving future parking:", e)
        db.rollback()
        return jsonify({"success": False, "error": "Unable to reserve future parking"}), 500

    finally:
        cursor.close()


@app.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    """
    API להרשמה - הכנסת משתמש חדש לבסיס הנתונים
    """
    if request.method == 'OPTIONS':
        return jsonify({'status': 'OK'}), 200

    data = request.json
    id = data.get('id')
    username = data.get('username')
    password = data.get('password')
    building = data.get('building')
    is_electric_car = data.get('is_electric_car', False)  # ברירת מחדל False אם לא נשלח
    is_disabled_user = data.get('is_disabled_user', False)  # ברירת מחדל False אם לא נשלח

    if not id or not username or not password or not building:
        return jsonify({"success": False, "message": "fill all"}), 400

    try:
        cursor = db.cursor()
        # בדיקה אם המשתמש כבר קיים
        check_query = "SELECT * FROM users WHERE username = %s OR id = %s"
        cursor.execute(check_query, (username, id))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "user already exists"}), 409

        # הוספת המשתמש החדש עם הערכים החדשים
        insert_query = """
            INSERT INTO users (id, username, password, building, role, is_electric_car, is_disabled_user)
            VALUES (%s, %s, %s, %s, 'guest', %s, %s)
        """
        cursor.execute(insert_query, (id, username, password, building, is_electric_car, is_disabled_user))
        db.commit()
        return jsonify({"success": True, "message": "your sign up successfully"})
    except psycopg2.Error as e:
        db.rollback()
        print(f"Database error during signup: {e}")
        return jsonify({"success": False, "message": "Error"}), 500
    finally:
        cursor.close()

@app.route('/users', methods=['GET'])
def get_users():
            """
            API להחזרת כל המשתמשים מה־DB
            """
            try:
                cursor = db.cursor()
                query = """
                    SELECT id, username, password, role, building, is_disabled_user, is_electric_car
                    FROM users
                """
                cursor.execute(query)
                rows = cursor.fetchall()

                # עיבוד הנתונים לפורמט JSON
                users = [
                    {
                        "id": row[0],
                        "username": row[1],
                        "password": row[2],  # **שיקול אבטחה: מומלץ לא להחזיר את הסיסמאות!**
                        "role": row[3],
                        "building": row[4],
                        "disabled": row[5],
                        "electric_car": row[6]
                    }
                    for row in rows
                ]

                return jsonify({"success": True, "users": users})
            except Exception as e:
                print("Error fetching users:", e)
                return jsonify({"success": False, "error": "Unable to fetch users"}), 500
            finally:
                cursor.close()

@app.route('/update-user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.json
        print("📥 Received data:", data)  

        cursor = db.cursor()

        # בדיקה אם המשתמש קיים
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user_exists = cursor.fetchone()

        if not user_exists:
            return jsonify({"success": False, "message": "User not found"}), 404

        # ✅ הפיכת הערכים הבוליאניים ל-True/False כדי להתאים ל-PostgreSQL
        is_disabled = bool(data["is_disabled_user"])
        is_electric = bool(data["is_electric_car"])

        # עדכון המשתמש
        cursor.execute("""
            UPDATE users 
            SET username = %s, role = %s, building = %s, is_disabled_user = %s, is_electric_car = %s
            WHERE id = %s
        """, (data["username"], data["role"], data["building"], is_disabled, is_electric, user_id))

        # 🔹 הדפסת מספר הרשומות שהושפעו
        print(f"🔄 Rows affected by UPDATE: {cursor.rowcount}")

        if cursor.rowcount == 0:
            print("⚠️ No rows updated. Check if the data is actually different.")
            return jsonify({"success": False, "message": "No changes detected"}), 400

        db.commit()
        print("✅ User updated successfully!")  

        return jsonify({"success": True, "message": "User updated successfully"})

    except Exception as e:
        db.rollback()
        print("❌ Error updating user:", str(e))
        return jsonify({"success": False, "message": f"Failed to update user: {str(e)}"}), 500

    finally:
        cursor.close()



@app.route('/parking-spots', methods=['GET'])
def retrieve_parking_spots():
    reservation_date = request.args.get("reservation_date")
    start_time = request.args.get("start_time")
    end_time = request.args.get("end_time")

    if not reservation_date or not start_time or not end_time:
        return jsonify({"success": False, "message": "All fields are required"}), 400

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
                   END AS status,
                   (NOT EXISTS (
                       SELECT 1 FROM reservations r
                       WHERE r.parking_spot_id = ps.id
                       AND r.reservation_date = %s
                       AND (r.start_time < %s AND r.end_time > %s)
                   )) AS availability,
                   ps.is_electric,
                   ps.is_disabled,
                   ps.latitude,
                   ps.longitude
            FROM parking_spots ps
            ORDER BY ps.id ASC
        """
        cursor.execute(query, (reservation_date, end_time, start_time, reservation_date, end_time, start_time))
        rows = cursor.fetchall()

        parking_spots = [
            {
                "id": row[0],
                "spot_code": row[1],
                "level": row[2],
                "status": row[3],
                "availability": row[4],
                "is_electric": row[5],
                "is_disabled": row[6],
                "latitude": row[7],
                "longitude": row[8],
            }
            for row in rows
        ]
        return jsonify({"success": True, "parkingSpots": parking_spots})
    except Exception as e:
        print("Error fetching parking spots:", e)
        return jsonify({"success": False, "error": "Unable to fetch parking spots"}), 500
    finally:
        cursor.close()

@app.route('/all-parking-spots', methods=['GET'])
def get_all_parking_spots():
    try:
        cursor = db.cursor()
        query = """
             SELECT ps.id, ps.spot_code, ps.level,
                   CASE 
                       WHEN EXISTS (
                           SELECT 1 FROM reservations r
                           WHERE r.parking_spot_id = ps.id
                       ) THEN 'Occupied'
                       ELSE 'Available'
                   END AS status,
                   NOT EXISTS (
                       SELECT 1 FROM reservations r
                       WHERE r.parking_spot_id = ps.id
                   ) AS availability,
                   ps.is_electric, ps.is_disabled
            FROM parking_spots ps
            ORDER BY ps.id ASC
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        parking_spots = [
            {
                "id": row[0],
                "spot_code": row[1],
                "level": row[2],
                "status": row[3],
                "availability": row[4],
                "is_electric": row[5],
                "is_disabled": row[6],
            }
            for row in rows
        ]
        return jsonify({"success": True, "parkingSpots": parking_spots})
    except Exception as e:
        print("Error fetching all parking spots:", e)
        return jsonify({"success": False, "error": "Unable to fetch parking spots"}), 500
    finally:
        cursor.close()
@app.route('/stats/parking-occupancy', methods=['GET'])
def get_parking_occupancy():
    try:
        cursor = db.cursor()
        query = """
            SELECT reservation_date, COUNT(*) as total_reservations
            FROM reservations
            GROUP BY reservation_date
            ORDER BY reservation_date;
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        occupancy_data = {str(row[0]): int(row[1]) if row[1] is not None else 0 for row in rows}

        print("📊 API Response:", occupancy_data)  # ✅ בדיקה בשרת Flask
        return jsonify({"success": True, "occupancy": occupancy_data})
    except Exception as e:
        print("Error fetching parking occupancy stats:", e)
        return jsonify({"success": False, "error": "Unable to fetch parking occupancy"}), 500
    finally:
        cursor.close()


@app.route('/stats/special-parking', methods=['GET'])
def get_special_parking_stats():
    try:
        cursor = db.cursor()
        query = """
            SELECT 
                SUM(CASE WHEN ps.is_electric = TRUE THEN 1 ELSE 0 END) AS electric_reserved,
                SUM(CASE WHEN ps.is_disabled = TRUE THEN 1 ELSE 0 END) AS disabled_reserved,
                COUNT(*) AS total_reserved
            FROM reservations r
            JOIN parking_spots ps ON r.parking_spot_id = ps.id;
        """
        cursor.execute(query)
        row = cursor.fetchone()

        special_stats = {
            "Electric": row[0],
            "Disabled": row[1],
            "Regular": row[2] - (row[0] + row[1])
        }

        return jsonify({"success": True, "specialParking": special_stats})
    except Exception as e:
        print("Error fetching special parking stats:", e)
        return jsonify({"success": False, "error": "Unable to fetch special parking stats"}), 500
    finally:
        cursor.close()

@app.route('/stats/employees-per-day', methods=['GET'])
def get_employees_per_day():
    try:
        cursor = db.cursor()
        query = """
            SELECT reservation_date, COUNT(DISTINCT username) AS unique_users
            FROM reservations
            GROUP BY reservation_date
            ORDER BY reservation_date;
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        employees_data = {row[0].strftime("%Y-%m-%d"): row[1] for row in rows}

        return jsonify({"success": True, "employees": employees_data})
    except Exception as e:
        print("Error fetching employees stats:", e)
        return jsonify({"success": False, "error": "Unable to fetch employees stats"}), 500
    finally:
        cursor.close()

@app.route('/delete-user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
            try:
                cursor = db.cursor()

                # בדיקה אם המשתמש קיים
                cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                user_exists = cursor.fetchone()

                if not user_exists:
                    return jsonify({"success": False, "message": "User not found"}), 404

                query = "DELETE FROM users WHERE id = %s"
                cursor.execute(query, (user_id,))
                db.commit()
                
                return jsonify({"success": True, "message": "User deleted successfully"})
            except Exception as e:
                print("Error deleting user:", e)
                db.rollback()
                return jsonify({"success": False, "message": "Failed to delete user"}), 500
            finally:
                cursor.close()


if __name__ == '__main__':
        app.run(host='0.0.0.0', port=5000, debug=True)