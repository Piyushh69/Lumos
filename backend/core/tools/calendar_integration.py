from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
import os
import pickle
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class CalendarIntegration:
    def __init__(self):
        self.SCOPES = ['https://www.googleapis.com/auth/calendar']
        self.service = self._authenticate()
    
    def _authenticate(self):
        """Authenticate with Google Calendar API"""
        creds = None
        
        # Load existing credentials
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)
        
        # If no valid credentials, authenticate
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                # For production, use service account credentials
                return None
        
        # Save credentials for next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
        
        return build('calendar', 'v3', credentials=creds)
    
    def create_interview_event(self, candidate_name: str, interviewer_email: str,
                             interview_date: str, duration_minutes: int = 60,
                             job_title: str = "", meeting_link: str = None) -> Optional[str]:
        """Create interview calendar event"""
        if not self.service:
            return None
            
        try:
            start_time = datetime.fromisoformat(interview_date)
            end_time = start_time + timedelta(minutes=duration_minutes)
            
            event = {
                'summary': f'Interview: {candidate_name} - {job_title}',
                'description': f'Interview with {candidate_name} for {job_title} position.\n\n'
                             f'Meeting Link: {meeting_link}' if meeting_link else '',
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'attendees': [
                    {'email': interviewer_email},
                ],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 30},       # 30 minutes before
                    ],
                },
            }
            
            if meeting_link:
                event['conferenceData'] = {
                    'createRequest': {
                        'requestId': f'interview-{candidate_name}-{int(start_time.timestamp())}',
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                }
            
            created_event = self.service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1 if meeting_link else 0
            ).execute()
            
            return created_event.get('id')
            
        except Exception as e:
            print(f"Calendar event creation failed: {e}")
            return None
    
    def find_available_slots(self, interviewer_email: str, date: str, 
                           duration_minutes: int = 60) -> List[Dict]:
        """Find available time slots for interviews"""
        if not self.service:
            return []
            
        try:
            # Get busy times for the interviewer
            start_date = datetime.fromisoformat(date)
            end_date = start_date + timedelta(days=1)
            
            freebusy_query = {
                'timeMin': start_date.isoformat() + 'Z',
                'timeMax': end_date.isoformat() + 'Z',
                'items': [{'id': interviewer_email}]
            }
            
            freebusy_result = self.service.freebusy().query(body=freebusy_query).execute()
            busy_times = freebusy_result['calendars'][interviewer_email]['busy']
            
            # Generate available slots (9 AM to 6 PM)
            available_slots = []
            current_time = start_date.replace(hour=9, minute=0, second=0, microsecond=0)
            end_time = start_date.replace(hour=18, minute=0, second=0, microsecond=0)
            
            while current_time < end_time:
                slot_end = current_time + timedelta(minutes=duration_minutes)
                
                # Check if slot conflicts with busy times
                is_available = True
                for busy in busy_times:
                    busy_start = datetime.fromisoformat(busy['start'].replace('Z', '+00:00'))
                    busy_end = datetime.fromisoformat(busy['end'].replace('Z', '+00:00'))
                    
                    if (current_time < busy_end and slot_end > busy_start):
                        is_available = False
                        break
                
                if is_available:
                    available_slots.append({
                        'start': current_time.isoformat(),
                        'end': slot_end.isoformat(),
                        'duration': duration_minutes
                    })
                
                current_time += timedelta(minutes=30)  # 30-minute intervals
            
            return available_slots
            
        except Exception as e:
            print(f"Finding available slots failed: {e}")
            return []
    
    def update_interview_event(self, event_id: str, updates: Dict) -> bool:
        """Update existing interview event"""
        if not self.service:
            return False
            
        try:
            event = self.service.events().get(calendarId='primary', eventId=event_id).execute()
            
            # Update event with new information
            for key, value in updates.items():
                event[key] = value
            
            updated_event = self.service.events().update(
                calendarId='primary',
                eventId=event_id,
                body=event
            ).execute()
            
            return True
            
        except Exception as e:
            print(f"Calendar event update failed: {e}")
            return False
    
    def cancel_interview_event(self, event_id: str) -> bool:
        """Cancel interview event"""
        if not self.service:
            return False
            
        try:
            self.service.events().delete(calendarId='primary', eventId=event_id).execute()
            return True
            
        except Exception as e:
            print(f"Calendar event cancellation failed: {e}")
            return False