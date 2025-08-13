# from sqlalchemy import create_engine, inspect
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
# from pathlib import Path
# import sys
# import os

# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# from config.database import DATABASE_URL, Base
# backend_dir = Path(__file__).parent.parent
# sys.path.insert(0, str(backend_dir))

# # Import ALL your models to register them with SQLAlchemy
# print("📦 Importing all models...")

# try:
#     from database.models.user import User
#     print("✅ User model imported")
# except ImportError as e:
#     print(f"❌ Failed to import User model: {e}")

# try:
#     from database.models.email_templates import EmailTemplate, EmailSignature, EmailAddon, EmailCampaign
#     print("✅ Email models imported")
# except ImportError as e:
#     print(f"❌ Failed to import Email models: {e}")

# try:
#     from database.models.candidate import Candidate, JobApplication
#     print("✅ Candidate models imported")
# except ImportError as e:
#     print(f"❌ Failed to import Candidate models: {e}")

# try:
#     from database.models.job import Job
#     print("✅ Job model imported")
# except ImportError as e:
#     print(f"❌ Failed to import Job model: {e}")

# try:
#     from database.models.assessment import TestTemplate, ScheduledTest
#     print("✅ Assessment models imported")
# except ImportError as e:
#     print(f"❌ Failed to import Assessment models: {e}")

# def create_tables():
#     """Create all database tables"""
#     try:
#         engine = create_engine(DATABASE_URL)
        
#         print("Creating database tables...")
#         print(f"Database URL: {DATABASE_URL}")
        
#         # Show what models are registered
#         print(f"📋 Registered tables in metadata: {list(Base.metadata.tables.keys())}")
        
#         # Create all tables
#         Base.metadata.create_all(bind=engine)
        
#         print("✅ All tables created successfully!")
        
#         # Verify tables were actually created
#         inspector = inspect(engine)
#         table_names = inspector.get_table_names()
#         print(f"🔍 Actual tables in database: {table_names}")
        
#         if not table_names:
#             print("⚠️  No tables found in database - check model imports!")
#             return False
        
#         return True
        
#     except Exception as e:
#         print(f"❌ Error creating tables: {e}")
#         return False

# def create_default_data():
#     """Create default users and data"""
#     try:
#         engine = create_engine(DATABASE_URL)
#         SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#         db = SessionLocal()
        
#         # Verify User model is available
#         try:
#             from database.models.user import User
#         except ImportError:
#             print("❌ User model not available for default data creation")
#             return False
        
#         # Create default admin user
#         existing_user = db.query(User).filter(User.username == "admin").first()
#         if not existing_user:
#             admin_user = User(
#                 username="admin",
#                 email="admin@navikenz.com",
#                 full_name="NaviHire Administrator",
#                 hashed_password="hashed_password_123",  # In production, use proper hashing
#                 role="admin",
#                 department="IT",
#                 is_active=True,
#                 is_verified=True
#             )
#             db.add(admin_user)
#             db.commit()
#             print("✅ Default admin user created")
#         else:
#             print("ℹ️ Admin user already exists")
        
#         db.close()
#         return True
        
#     except Exception as e:
#         print(f"❌ Error creating default data: {e}")
#         return False

# if __name__ == "__main__":
#     print("🚀 Initializing NaviHire Database...")
    
#     if create_tables():
#         if create_default_data():
#             print("🎉 Database initialization completed!")
#         else:
#             print("💥 Database initialization failed!")
#     else:
#         print("💥 Database initialization failed!")

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from config.database import DATABASE_URL
from database.base import Base  # Import shared Base

print("📦 Importing all models...")

# Import all models to register them with Base
try:
    from database.models.user import User
    print("✅ User model imported")
except ImportError as e:
    print(f"❌ Failed to import User model: {e}")

try:
    from database.models.email_templates import EmailTemplate, EmailSignature, EmailAddon, EmailCampaign
    print("✅ Email models imported")
except ImportError as e:
    print(f"❌ Failed to import Email models: {e}")

try:
    from database.models.candidate import Candidate, JobApplication
    print("✅ Candidate models imported")
except ImportError as e:
    print(f"❌ Failed to import Candidate models: {e}")

try:
    from database.models.job import Job
    print("✅ Job model imported")
except ImportError as e:
    print(f"❌ Failed to import Job model: {e}")

try:
    from database.models.assessment import TestTemplate, ScheduledTest
    print("✅ Assessment models imported")
except ImportError as e:
    print(f"❌ Failed to import Assessment models: {e}")

def create_tables():
    """Create all database tables"""
    try:
        engine = create_engine(DATABASE_URL)
        
        print("Creating database tables...")
        print(f"Database URL: {DATABASE_URL}")
        
        # Show what models are registered
        print(f"📋 Registered tables in metadata: {list(Base.metadata.tables.keys())}")
        
        if not Base.metadata.tables:
            print("❌ No tables registered in metadata! Check model imports and Base usage.")
            return False
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ All tables created successfully!")
        
        # Verify tables were actually created
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        print(f"🔍 Actual tables in database: {table_names}")
        
        if not table_names:
            print("⚠️  No tables found in database - check model imports!")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

def create_default_data():
    """Create default users and data"""
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Import User model
        from database.models.user import User
        
        # Create default admin user
        existing_user = db.query(User).filter(User.username == "admin").first()
        if not existing_user:
            admin_user = User(
                username="admin",
                email="admin@navikenz.com",
                full_name="NaviHire Administrator",
                hashed_password="hashed_password_123",
                role="admin",
                department="IT",
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Default admin user created")
        else:
            print("ℹ️ Admin user already exists")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating default data: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Initializing NaviHire Database...")
    
    if create_tables():
        create_default_data()
        print("🎉 Database initialization completed!")
    else:
        print("💥 Database initialization failed!")