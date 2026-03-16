---
title: MindQuest AI
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# MindQuest AI Service

Python-based AI microservice for MindQuest brainstorming platform.

## Features

- **Text Embeddings**: TF-IDF based vectorization
- **Clustering**: K-Means and DBSCAN algorithms
- **Duplicate Detection**: Cosine similarity analysis
- **Sentiment Analysis**: Gemini AI powered sentiment classification
- **Idea Generation**: Creative suggestions using Gemini Pro
- **Session Summaries**: Comprehensive summaries with insights
- **AI Chat**: Context-aware brainstorming assistant
- **Keyword Extraction**: TF-IDF based keyword identification

## Endpoints

- `POST /check-duplicate` - Check for duplicate ideas
- `POST /cluster` - Cluster ideas using K-Means
- `POST /advanced-cluster` - Cluster using DBSCAN
- `POST /summarize` - Generate session summary
- `POST /generate-ideas` - Generate new ideas
- `POST /chat` - AI chat about session
- `GET /health` - Health check
