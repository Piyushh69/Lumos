# NaviHire - AI-Powered Talent & Travel Intelligence Platform

## Overview
NaviHire revolutionizes HR operations by combining intelligent talent acquisition with corporate travel optimization in a unified AI-powered platform.

## Features
- AI-powered resume analysis and candidate matching
- Intelligent flight search and travel optimization
- Real-time HR analytics and insights
- Automated workflow management
- Conversational AI interface
- Persistent memory and learning

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone the repository**
    git clone 
    cd navihire

2. **Backend Setup**
    cd backend
    run .\setup_env.bat
    or simply : pip install -r requirements.txt
    cp .env.example .env
    Edit .env with your API keys

3. **Frontend Setup**
    cd frontend
    npm install

4. **Database Setup**
    docker-compose up -d postgres redis

5. **Run the Application**
    Backend
    cd backend && python main.py

    Frontend (new terminal)
    cd frontend && npm start

## API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

## Architecture
- **Backend**: FastAPI + LangGraph + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS
- **AI**: Google Gemini + ChromaDB
- **Real-time**: WebSocket communication

## Contributing
    1. Fork the repository
    2. Create a feature branch
    3. Make your changes
    4. Submit a pull request

## License
    Copyright © 2025 Navikenz. All rights reserved.
    Next Steps
    Run the setup:

    cd navihire/backend
    pip install -r requirements.txt
    cp .env.example .env
    # Add your GEMINI_API_KEY to .env
    python main.py

## Test the system:

    Upload resumes via API

    Generate job descriptions

    Test candidate matching

    Try flight search functionality

    Frontend development:

    cd navihire/frontend
    npm install
    npm start