# VAT Processing System - Monorepo

This is a monorepo containing both the backend and frontend components of the VAT processing system.

## Project Structure

```
my-vat/
├── backend/                    # Python FastAPI backend
│   ├── app.py                 # FastAPI application
│   ├── run.py                 # Development server
│   ├── config.py              # Configuration settings
│   ├── requirements.txt       # Python dependencies
│   ├── routes/                # API routes
│   ├── services/              # Business services
│   ├── models/                # Data models
│   ├── BL/                    # Business logic layer
│   └── tests/                 # Backend tests
├── frontend/                   # React + Vite frontend
│   ├── src/                   # React source code
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   └── vite.config.ts         # Vite configuration
└── .vscode/                   # VS Code configurations
    └── launch.json            # Debug configurations
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy the example environment file and configure:
```bash
cp env.example .env
# Edit .env with your configurations
```

5. Run the development server:
```bash
python run.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Development

### Using VS Code

This project includes VS Code launch configurations for easy development:

#### Backend Configurations:
- **🚀 FastAPI Dev Server** - Main development server
- **🔧 FastAPI Debug Server** - Debug mode with breakpoints
- **🧪 Run Tests** - Execute backend tests
- **🔍 Run VAT System Tests** - Run VAT-specific tests

#### Frontend Configurations:
- **⚛️ React Frontend Dev Server** - Start React development server
- **🏗️ Build Frontend** - Build production frontend

### Running Both Services

To run both backend and frontend simultaneously:

1. **Terminal 1** (Backend):
```bash
cd backend && python run.py
```

2. **Terminal 2** (Frontend):
```bash
cd frontend && npm run dev
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Key Features

### Backend (FastAPI)
- 🔐 Google OAuth2 authentication
- 📄 Invoice and Summary CRUD operations
- 👤 Account management
- 📤 Large file upload support (>500MB)
- 🤖 AI processing integration
- 🗄️ MongoDB integration
- 📊 Advanced filtering and pagination

### Frontend (React + Vite)
- ⚛️ React 18 with TypeScript
- ⚡ Vite for fast development
- 🎨 Modern UI components
- 📱 Responsive design

## Environment Variables

### Backend (.env in backend/)
```env
# Server Configuration
HOST=localhost
PORT=8000

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=upload_tracker

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

### Frontend
Environment variables for the frontend can be added to `frontend/.env` following Vite's conventions.

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Building for Production

### Backend
```bash
cd backend
# Backend runs directly with Python
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
```

## Contributing

1. Create a feature branch
2. Make changes in appropriate directory (`backend/` or `frontend/`)
3. Add tests for new functionality
4. Submit a pull request

## License

This project is licensed under the MIT License. 