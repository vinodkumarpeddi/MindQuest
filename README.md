# MindQuest: AI-Powered Collaborative Brainstorming Assistant

**Transform your brainstorming sessions with AI-powered organization and real-time collaboration**

---

## Overview

MindQuest is a cutting-edge, real-time collaborative brainstorming platform that combines the spontaneity of traditional ideation with the power of artificial intelligence. Designed for distributed teams, students, startups, and professionals, MindQuest provides an intelligent canvas where ideas flourish and innovation thrives.

## Key Features

### Core Collaboration
- Real-Time Sync with Socket.IO
- Drag & Drop sticky note interface
- Voting & emoji reactions
- Session management (public/private)
- Role-based access control

### AI-Powered Intelligence
- **Automatic Clustering**: K-Means & DBSCAN algorithms group similar ideas
- **Duplicate Detection**: TF-IDF embeddings + cosine similarity
- **Sentiment Analysis**: Gemini AI classifies idea sentiment
- **Idea Generation**: Context-aware AI suggestions
- **Session Summaries**: Comprehensive AI-generated reports
- **Keyword Extraction**: Automatic tag generation

## Tech Stack

**Frontend**: React 18, Vite, Tailwind CSS, Socket.IO Client
**Backend**: Node.js, Express, Socket.IO, MongoDB, Mongoose
**AI Service**: Python, Flask, scikit-learn, Google Gemini AI
**Database**: MongoDB Atlas

## Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB Atlas account
- Gemini API key

### Installation

```bash
npm install
cd ai_service && pip install -r requirements.txt && cd ..
```

### Configuration

Create `.env` file:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mindquest
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret_key
PORT=3001

VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_AI_SERVICE_URL=http://localhost:5000
```

### Run Application

**Start all services:**
```bash
npm run start:all
```

**Or separately:**
```bash
npm run dev        # Frontend (port 5173)
npm run server     # Backend (port 3001)
npm run ai-service # AI Service (port 5000)
```

Visit: **http://localhost:5173**

## Project Structure

```
mindquest/
├── src/              # React frontend
│   ├── components/   # UI components
│   ├── pages/        # Route pages
│   ├── context/      # React Context
│   └── utils/        # Helpers
├── server/           # Node.js backend
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API routes
│   ├── services/     # External services
│   └── sockets/      # Socket.IO handlers
├── ai_service/       # Python AI microservice
│   ├── app.py        # Flask app
│   └── requirements.txt
└── .env              # Environment variables
```

## Usage

1. **Create Account**: Register and login
2. **Create Session**: Start a brainstorming session
3. **Add Ideas**: Type or use AI generation
4. **Organize**: Drag notes, vote, add reactions
5. **Cluster**: AI groups similar ideas
6. **Summarize**: Generate AI summary and export

## AI Features

### Clustering
```python
kmeans = KMeans(n_clusters=n, random_state=42)
labels = kmeans.fit_predict(embeddings)
```

### Duplicate Detection
```python
similarity = cosine_similarity([new], [existing])[0][0]
is_duplicate = similarity > 0.85
```

### Sentiment Analysis
Gemini AI classifies as positive/negative/neutral

## API Endpoints

**Auth**: `/api/auth/register`, `/api/auth/login`
**Sessions**: `/api/sessions`, `/api/sessions/:id`
**Ideas**: `/api/ideas`, `/api/ideas/:id/vote`
**AI**: `/api/clusters/trigger`, `/api/clusters/summarize`

## Deployment

**Frontend**: Vercel
**Backend**: Render/Railway
**AI Service**: Render/Railway
**Database**: MongoDB Atlas

## Troubleshooting

- **MongoDB**: Check connection string and IP whitelist
- **AI Service**: Ensure running on port 5000
- **Socket.IO**: Verify CORS settings
- **Clustering**: Need minimum 3 ideas

## Future Enhancements

- Voice-to-text input
- Mind map visualization
- Multilingual support
- Integration plugins (Slack, Notion)
- Advanced analytics dashboard

## License

MIT License

## Contact

GitHub Issues: [Report bugs](https://github.com/yourrepo/issues)

---

**Happy Brainstorming!** 🚀💡✨
