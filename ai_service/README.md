# MindQuest AI Service

Python-based AI microservice for MindQuest brainstorming platform.

## Features

- **Text Embeddings**: TF-IDF based vectorization
- **Clustering**: K-Means and DBSCAN algorithms
- **Duplicate Detection**: Cosine similarity analysis
- **Sentiment Analysis**: Gemini AI powered sentiment classification
- **Idea Generation**: Creative suggestions using Gemini Pro
- **Session Summaries**: Comprehensive summaries with insights
- **Keyword Extraction**: TF-IDF based keyword identification

## Setup

```bash
cd ai_service
pip install -r requirements.txt
python app.py
```

The service runs on port 5000.

## Environment Variables

```
GEMINI_API_KEY=your_api_key_here
```

## Endpoints

- `POST /check-duplicate` - Check for duplicate ideas
- `POST /cluster` - Cluster ideas using K-Means
- `POST /advanced-cluster` - Cluster using DBSCAN
- `POST /summarize` - Generate session summary
- `POST /generate-ideas` - Generate new ideas
- `GET /health` - Health check
