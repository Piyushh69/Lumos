from config.database import get_database_session, close_database_session

try:
    db = get_database_session()
    print("✅ Database connection successful!")
    close_database_session(db)
except Exception as e:
    print(f"❌ Database connection failed: {e}")