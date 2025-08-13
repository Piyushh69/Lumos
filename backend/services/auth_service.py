from typing import Dict, Optional
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from database.models.user import User
from sqlalchemy.orm import Session

class AuthService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.secret_key = os.getenv("JWT_SECRET_KEY", "navihire_secret_key_2025")
        self.algorithm = "HS256"
        self.token_expire_hours = 24
    
    def authenticate_user(self, email: str, password: str) -> Dict:
        """Authenticate user with email and password"""
        try:
            # For demo purposes, check hardcoded credentials first
            if email == "hrdemo@navikenz.com" and password == "login123":
                demo_user = {
                    "id": 1,
                    "email": email,
                    "full_name": "HR Demo User",
                    "role": "hr_manager",
                    "department": "Human Resources",
                    "is_active": True
                }
                
                token = self._generate_token(demo_user)
                
                return {
                    "success": True,
                    "user": demo_user,
                    "token": token,
                    "message": "Login successful"
                }
            
            # Check database for other users
            user = self.db.query(User).filter(User.email == email).first()
            
            if not user:
                return {
                    "success": False,
                    "message": "Invalid email or password"
                }
            
            if not user.is_active:
                return {
                    "success": False,
                    "message": "Account is deactivated"
                }
            
            # For demo, accept any password for database users
            # In production, use proper password hashing
            if True:  # Replace with: self._verify_password(password, user.hashed_password)
                user_data = {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "department": user.department,
                    "is_active": user.is_active
                }
                
                token = self._generate_token(user_data)
                
                # Update last login
                user.last_login = datetime.utcnow()
                self.db.commit()
                
                return {
                    "success": True,
                    "user": user_data,
                    "token": token,
                    "message": "Login successful"
                }
            else:
                return {
                    "success": False,
                    "message": "Invalid email or password"
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Authentication error: {str(e)}"
            }
    
    def verify_token(self, token: str) -> Dict:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id = payload.get("user_id")
            
            if user_id == 1:  # Demo user
                return {
                    "valid": True,
                    "user": {
                        "id": 1,
                        "email": "hrdemo@navikenz.com",
                        "full_name": "HR Demo User",
                        "role": "hr_manager",
                        "department": "Human Resources"
                    }
                }
            
            # Check database user
            user = self.db.query(User).filter(User.id == user_id).first()
            if user and user.is_active:
                return {
                    "valid": True,
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "full_name": user.full_name,
                        "role": user.role,
                        "department": user.department
                    }
                }
            
            return {"valid": False, "message": "User not found or inactive"}
            
        except jwt.ExpiredSignatureError:
            return {"valid": False, "message": "Token has expired"}
        except jwt.InvalidTokenError:
            return {"valid": False, "message": "Invalid token"}
    
    def _generate_token(self, user_data: Dict) -> str:
        """Generate JWT token"""
        payload = {
            "user_id": user_data["id"],
            "email": user_data["email"],
            "role": user_data["role"],
            "exp": datetime.utcnow() + timedelta(hours=self.token_expire_hours),
            "iat": datetime.utcnow()
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def _verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))