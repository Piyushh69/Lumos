import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from database.base import Base 

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1827@localhost:5432/navihire_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_database_session() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    except Exception as e:
        db.close()
        raise e

def close_database_session(db: Session):
    """Close database session"""
    try:
        db.close()
    except Exception as e:
        print(f"Error closing database session: {e}")