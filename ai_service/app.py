from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer, HashingVectorizer
from scipy.cluster.hierarchy import linkage, fcluster
import google.generativeai as genai
import os
from datetime import datetime
import re
import json

app = Flask(__name__)
CORS(app)

# Configure Gemini API (replace environment var or set GEMINI_API_KEY)
# NOTE: Ensure your GEMINI_API_KEY environment variable is set correctly.
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

# --- FIX ---
# The model 'gemini-pro' is often deprecated in favor of versioned models.
# 'gemini-1.0-pro' is the correct model name for the standard Gemini Pro API,
# and it is compatible with the free tier.
try:
    model = genai.GenerativeModel('gemini-2.0-flash') #gemini-pro-latest
except Exception as e:
    # If model initialization fails, set to None and handle gracefully later
    print(f"🚨 Failed to initialize Gemini model: {e}")
    model = None

# Fixed embedding dimensionality used across the service
EMBED_DIM = 384

CLUSTER_COLORS = [
    '#fef08a', '#bfdbfe', '#fecaca', '#bbf7d0', '#e9d5ff',
    '#fed7aa', '#fecdd3', '#a7f3d0', '#ddd6fe', '#fbcfe8'
]

# Use a stateless HashingVectorizer so every embedding has fixed dimension
HASH_VECTORIZER = HashingVectorizer(n_features=EMBED_DIM, alternate_sign=False, norm='l2', dtype=np.float32)

def normalize_embedding(emb):
    """
    Ensure embedding is a list/array of length EMBED_DIM.
    If shorter, pad with zeros; if longer, truncate; convert to float.
    """
    if emb is None:
        return [0.0] * EMBED_DIM

    # If it's already a numpy array
    try:
        arr = np.asarray(emb, dtype=float)
    except Exception:
        # fallback if embedding contains non-numeric values
        return [0.0] * EMBED_DIM

    if arr.ndim == 0:
        arr = np.array([float(arr)])

    if arr.size == EMBED_DIM:
        return arr.astype(float).tolist()

    if arr.size < EMBED_DIM:
        padded = np.zeros(EMBED_DIM, dtype=float)
        padded[:arr.size] = arr.flatten()
        return padded.tolist()

    # arr.size > EMBED_DIM
    return arr.flatten()[:EMBED_DIM].astype(float).tolist()

def generate_embedding(text):
    """Generate fixed-size embedding for text using HashingVectorizer (deterministic length)."""
    if not text:
        return [0.0] * EMBED_DIM

    print(f"🔢 Generating embedding for text: {text[:50]}...")
    try:
        vec = HASH_VECTORIZER.transform([text])  # returns sparse matrix shape (1, EMBED_DIM)
        arr = vec.toarray()[0].astype(float)
        return arr.tolist()
    except Exception as e:
        print(f"Embedding error: {e}")
        return [0.0] * EMBED_DIM

def analyze_sentiment(text):
    """Analyze sentiment using Gemini AI or fallback heuristic."""
    print(f"😊 Analyzing sentiment for: {text[:80]}...")

    # Handle empty input
    if not text or len(text.strip()) == 0:
        return {"label": "neutral", "score": 0.5}

    # ✅ Heuristic fallback if Gemini unavailable (free-tier safe)
    if model is None:
        lower_text = text.lower()
        positive_words = ["good", "great", "amazing", "love", "excellent", "positive", "beneficial", "happy", "improve"]
        negative_words = ["bad", "worse", "terrible", "hate", "poor", "negative", "problem", "issue", "waste"]

        pos = sum(w in lower_text for w in positive_words)
        neg = sum(w in lower_text for w in negative_words)
        if pos > neg:
            return {"label": "positive", "score": round(0.6 + 0.1 * pos, 2)}
        elif neg > pos:
            return {"label": "negative", "score": round(0.6 + 0.1 * neg, 2)}
        else:
            return {"label": "neutral", "score": 0.5}

    # ✅ Gemini prompt for structured response
    prompt = f"""
Analyze the sentiment of the following idea and return a concise JSON:
Idea: "{text}"

Return format:
{{
  "label": "positive" | "negative" | "neutral",
  "score": number between 0 and 1
}}
"""

    try:
        response = model.generate_content(prompt)
        raw = getattr(response, "text", None) or str(response)
        result = raw.strip()
        result = re.sub(r'```json\s*|\s*```', '', result)

        # Try parsing directly as JSON
        try:
            sentiment = json.loads(result)
        except json.JSONDecodeError:
            # Fallback: extract manually using regex
            match = re.search(r'"?label"?\s*[:=]?\s*"?(\w+)"?', result, re.I)
            score_match = re.search(r'"?score"?\s*[:=]?\s*([0-9.]+)', result)
            label = match.group(1).lower() if match else "neutral"
            score = float(score_match.group(1)) if score_match else 0.5
            sentiment = {"label": label, "score": score}

        label = sentiment.get("label", "neutral").lower()
        score = float(sentiment.get("score", 0.5))
        score = max(0.0, min(1.0, score))

        print(f"✅ Sentiment detected: {label} ({score})")
        return {"label": label, "score": score}

    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        # fallback simple heuristic
        lower_text = text.lower()
        if any(w in lower_text for w in ["good", "amazing", "great", "love"]):
            return {"label": "positive", "score": 0.8}
        elif any(w in lower_text for w in ["bad", "terrible", "hate", "poor"]):
            return {"label": "negative", "score": 0.8}
        else:
            return {"label": "neutral", "score": 0.5}

def extract_keywords(text):
    """Extract keywords using TF-IDF (best-effort)."""
    try:
        vectorizer = TfidfVectorizer(max_features=5, stop_words='english')
        vectors = vectorizer.fit_transform([text])
        keywords = vectorizer.get_feature_names_out()
        scores = vectors.toarray()[0]
        return [{"word": kw, "score": float(sc)} for kw, sc in zip(keywords, scores)]
    except Exception as e:
        print(f"Keyword extraction error: {e}")
        # fallback: simple heuristics
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        uniq = list(dict.fromkeys(words))[:5]
        return [{"word": w, "score": 0.0} for w in uniq]

def extract_tags(text):
    """Extract tags from text using Gemini (best-effort)."""
    print(f"🏷️  Extracting tags for text: {text[:50]}...")
    if model is None:
        words = text.lower().split()
        return [w for w in words if len(w) > 4][:3]

    try:
        prompt = f"""Extract 3-5 relevant tags/keywords from this idea. Return ONLY a JSON array of strings:
Idea: "{text}"

Example: ["technology", "innovation", "design"]"""

        response = model.generate_content(prompt)
        raw = response.text
        result = raw.strip()
        result = re.sub(r'```json\s*|\s*```', '', result)
        tags = json.loads(result)
        if isinstance(tags, list):
            return tags[:5]
        # fallback if not a list
        return [str(tags)] if tags else []
    except Exception as e:
        print(f"Tag extraction error: {e}")
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        return [w for w in words][:3]

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK", "service": "MindQuest AI Service"})

@app.route('/check-duplicate', methods=['POST'])
def check_duplicate():
    """Check if new idea is duplicate and generate embedding"""
    data = request.json or {}
    new_idea = data.get('newIdea', '') or ''
    existing_ideas = data.get('existingIdeas', []) or []

    print(f"🔍 Checking duplicate for: {new_idea[:50]}...")

    new_embedding = generate_embedding(new_idea)
    new_embedding = normalize_embedding(new_embedding)

    sentiment = analyze_sentiment(new_idea)
    tags = extract_tags(new_idea)

    max_similarity = 0.0
    duplicate_of = None

    for existing in existing_ideas:
        existing_emb = existing.get('embedding')
        if existing_emb and isinstance(existing_emb, (list, tuple, np.ndarray)) and len(existing_emb) > 0:
            existing_norm = normalize_embedding(existing_emb)
            try:
                sim = float(cosine_similarity([new_embedding], [existing_norm])[0][0])
            except Exception:
                sim = 0.0
            if sim > max_similarity:
                max_similarity = sim
                duplicate_of = existing.get('id')
        else:
            # if existing embedding missing, try to generate from existing['content'] if available
            content = existing.get('content', '')
            if content:
                existing_norm = generate_embedding(content)
                existing_norm = normalize_embedding(existing_norm)
                try:
                    sim = float(cosine_similarity([new_embedding], [existing_norm])[0][0])
                except Exception:
                    sim = 0.0
                if sim > max_similarity:
                    max_similarity = sim
                    duplicate_of = existing.get('id')

    is_duplicate = max_similarity > 0.85

    if is_duplicate:
        print(f"⚠️  Duplicate detected! Similarity: {max_similarity:.4f}")

    return jsonify({
        "isDuplicate": is_duplicate,
        "duplicateOf": duplicate_of,
        "similarity": max_similarity,
        "embedding": new_embedding,
        "sentiment": sentiment,
        "tags": tags
    })

@app.route('/cluster', methods=['POST'])
def cluster_ideas():
    """Cluster ideas using K-Means and generate labels with Gemini"""
    data = request.json or {}
    ideas = data.get('ideas', []) or []

    print(f"🎨 Clustering {len(ideas)} ideas using K-Means algorithm...")

    embeddings = []
    valid_ideas = []

    for idea in ideas:
        # prefer existing embedding if supplied, but normalize it
        emb = idea.get('embedding')
        if emb and isinstance(emb, (list, tuple, np.ndarray)) and len(emb) > 0:
            norm_emb = normalize_embedding(emb)
            embeddings.append(norm_emb)
            valid_ideas.append(idea)
        else:
            # generate from content
            content = idea.get('content', '') or ''
            gen_emb = generate_embedding(content)
            gen_emb = normalize_embedding(gen_emb)
            embeddings.append(gen_emb)
            valid_ideas.append(idea)

    if len(valid_ideas) < 3:
        return jsonify({"error": "Need at least 3 ideas"}), 400

    # choose number of clusters: between 3 and 8
    n_clusters = min(max(3, len(valid_ideas) // 5), 8)
    n_clusters = max(1, n_clusters)  # ensure >=1

    print(f"📊 Creating {n_clusters} clusters...")

    try:
        X = np.vstack([np.asarray(e, dtype=float) for e in embeddings])
    except Exception as e:
        print(f"Error building embedding matrix: {e}")
        # attempt safe conversion
        X = np.array([normalize_embedding(e) for e in embeddings], dtype=float)

    # If X has constant rows (rare), KMeans can still run but may warn.
    try:
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)
    except Exception as e:
        print(f"KMeans error: {e}")
        # fallback: place everything in 1 cluster
        labels = np.zeros(len(valid_ideas), dtype=int)
        kmeans = None

    clusters = []
    for i in range(n_clusters):
        cluster_indices = [j for j in range(len(valid_ideas)) if int(labels[j]) == i]
        cluster_ideas_list = [valid_ideas[j] for j in cluster_indices]

        if not cluster_ideas_list:
            continue

        idea_texts = [idea.get('content', '') for idea in cluster_ideas_list]
        sample_ideas = idea_texts[:5]

        print(f"🏷️  Generating label for cluster {i+1} using Gemini AI...")
        label = f"Theme {i+1}"
        description = f"Group of {len(cluster_ideas_list)} related ideas"

        if model is not None:
            try:
                prompt = f"""Analyze these brainstorming ideas and create a short theme label (2-4 words):

Ideas:
{chr(10).join(f"- {idea}" for idea in sample_ideas)}

Respond with ONLY a JSON object:
{{"label": "Theme Name", "description": "Brief description of the theme"}}"""

                response = model.generate_content(prompt)
                raw = response.text
                result = raw.strip()
                result = re.sub(r'```json\s*|\s*```', '', result)
                label_data = json.loads(result)
                label = label_data.get('label', label)
                description = label_data.get('description', description)
            except Exception as e:
                print(f"Label generation error: {e}")

        keywords = extract_keywords(' '.join(idea_texts))

        centroid = None
        if kmeans is not None and hasattr(kmeans, 'cluster_centers_'):
            try:
                centroid = kmeans.cluster_centers_[i].tolist()
            except Exception:
                centroid = None

        inertia = getattr(kmeans, "inertia_", None)
        confidence = 0.0
        try:
            if inertia is not None and len(valid_ideas) > 0:
                confidence = float(1.0 - (inertia / max(1.0, len(valid_ideas))))
                confidence = max(0.0, min(1.0, confidence))
        except Exception:
            confidence = 0.0

        clusters.append({
            "label": label,
            "description": description,
            "ideas": [idea.get('id') for idea in cluster_ideas_list],
            "color": CLUSTER_COLORS[i % len(CLUSTER_COLORS)],
            "centroid": centroid,
            "algorithm": "kmeans",
            "confidence": confidence,
            "keywords": keywords
        })

    print(f"✅ Successfully created {len(clusters)} clusters")

    return jsonify({"clusters": clusters})

@app.route('/summarize', methods=['POST'])
def summarize_session():
    """Generate comprehensive project abstract using Gemini AI"""
    data = request.json or {}
    session_name = data.get('sessionName', '')
    session_desc = data.get('sessionDescription', '')
    ideas = data.get('ideas', []) or []
    top_ideas = data.get('topIdeas', []) or []
    clusters = data.get('clusters', []) or []
    total_participants = data.get('totalParticipants', 0)

    print(f"📝 Generating comprehensive abstract for: {session_name} ({len(ideas)} ideas)")

    if not top_ideas:
        try:
            top_ideas = sorted(ideas, key=lambda x: x.get('votes', 0), reverse=True)[:10]
        except Exception:
            top_ideas = ideas[:10]

    # Build comprehensive prompt with ALL ideas
    all_ideas_text = chr(10).join(
        f"- \"{idea.get('content','')}\" (by {idea.get('author','unknown')}, {idea.get('votes',0)} votes, sentiment: {idea.get('sentiment','neutral')})"
        for idea in ideas
    )

    cluster_text = chr(10).join(
        f"- {c.get('label','Unnamed')}: {c.get('ideaCount', 0)} ideas, keywords: {', '.join(c.get('keywords', []))}"
        for c in clusters
    ) if clusters else "No clusters created yet."

    prompt = f"""You are an expert project analyst. Generate a comprehensive PROJECT ABSTRACT and analysis for this brainstorming session.

PROJECT: {session_name}
{f'DESCRIPTION: {session_desc}' if session_desc else ''}
PARTICIPANTS: {total_participants}
TOTAL IDEAS: {len(ideas)}
CLUSTERS: {len(clusters)}

ALL IDEAS IN THIS SESSION:
{all_ideas_text}

THEMATIC CLUSTERS:
{cluster_text}

TOP VOTED IDEAS:
{chr(10).join(f"- \"{i.get('content','')}\" ({i.get('votes',0)} votes)" for i in top_ideas[:5])}

Generate a DETAILED JSON response with these sections:
{{
  "summary": "A comprehensive 3-4 paragraph project abstract that covers: 1) Overview of the brainstorming session and its purpose, 2) Key themes and patterns discovered across ALL ideas, 3) The most impactful and innovative ideas, 4) Overall assessment and potential next steps. Write it as a professional project abstract.",
  "insights": ["5-7 specific, data-driven insights drawn from analyzing ALL the ideas. Reference specific ideas and patterns. Each insight should be actionable and substantive."],
  "recommendations": ["3-5 concrete next-step recommendations based on the brainstorming results. Be specific about what actions to take and which ideas to pursue first."]
}}

IMPORTANT: Analyze ALL {len(ideas)} ideas thoroughly, not just the top ones. Find patterns, contradictions, gaps, and opportunities across the entire idea set."""

    if model is None:
        return jsonify({
            "summary": f"Project '{session_name}' brainstorming session engaged {total_participants} participants who collectively generated {len(ideas)} unique ideas across {len(clusters)} thematic clusters.\n\nThe session demonstrated strong collaborative engagement with diverse perspectives contributing to the discussion. Ideas ranged across multiple themes, showing both breadth and depth of creative thinking.\n\nThe most popular ideas received significant community validation through the voting system, indicating strong consensus around key themes. The AI clustering revealed {len(clusters)} distinct topic areas, suggesting a well-structured exploration of the problem space.",
            "insights": [
                f"Generated {len(ideas)} unique ideas from {total_participants} participants",
                f"Ideas organized into {len(clusters)} thematic clusters",
                f"Top idea received {top_ideas[0].get('votes', 0) if top_ideas else 0} votes",
                "Multiple perspectives contributed to a diverse idea set",
                "Voting patterns show clear consensus on key priorities"
            ],
            "recommendations": [
                "Focus on implementing the top-voted ideas first",
                "Explore combining related ideas from the same clusters",
                "Schedule follow-up session to refine the most promising concepts"
            ]
        })

    try:
        response = model.generate_content(prompt)
        raw = response.text
        result = raw.strip()
        result = re.sub(r'```json\s*|\s*```', '', result)
        summary_data = json.loads(result)
        print(f"✅ Comprehensive abstract generated ({len(summary_data.get('insights', []))} insights, {len(summary_data.get('recommendations', []))} recommendations)")
        return jsonify(summary_data)
    except Exception as e:
        print(f"Summary generation error: {e}")
        return jsonify({
            "summary": f"Project '{session_name}' brainstorming session generated {len(ideas)} ideas from {total_participants} participants across {len(clusters)} thematic clusters. The session showed strong engagement with diverse creative contributions.",
            "insights": [
                f"Generated {len(ideas)} unique ideas",
                f"Organized into {len(clusters)} thematic clusters",
                f"Top idea received {top_ideas[0].get('votes', 0) if top_ideas else 0} votes"
            ],
            "recommendations": [
                "Prioritize top-voted ideas for implementation",
                "Combine related ideas from the same clusters",
                "Schedule follow-up to refine concepts"
            ]
        })

@app.route('/generate-ideas', methods=['POST'])
def generate_ideas():
    """Generate new ideas using Gemini AI"""
    data = request.json or {}
    session_name = data.get('sessionName', '')
    prompt_text = data.get('prompt', '') or ''
    existing_ideas = data.get('existingIdeas', []) or []

    print(f"💭 Generating new ideas for: {prompt_text or session_name}")

    context = f"""Generate 5 creative and unique brainstorming ideas.

Topic: {prompt_text or session_name}

Existing ideas (for context):
{chr(10).join(f"- {idea}" for idea in existing_ideas[:10])}

Generate NEW ideas that complement but don't duplicate the existing ones. Return ONLY a JSON array:
["idea 1", "idea 2", "idea 3", "idea 4", "idea 5"]"""

    if model is None:
        # fallback generated ideas
        return jsonify({"ideas": [
            f"Explore {prompt_text or session_name} from a different perspective",
            f"Consider the opposite approach to {prompt_text or session_name}",
            f"Combine {prompt_text or session_name} with emerging technologies",
            f"Simplify {prompt_text or session_name} to its core essence",
            f"Scale {prompt_text or session_name} to reach more users"
        ]})

    try:
        response = model.generate_content(context)
        raw = response.text
        result = raw.strip()
        result = re.sub(r'```json\s*|\s*```', '', result)
        ideas = json.loads(result)
        print(f"✅ Generated {len(ideas)} new ideas")
        return jsonify({"ideas": ideas})
    except Exception as e:
        print(f"Idea generation error: {e}")
        return jsonify({"ideas": [
            f"Explore {prompt_text or session_name} from a different perspective",
            f"Consider the opposite approach to {prompt_text or session_name}",
            f"Combine {prompt_text or session_name} with emerging technologies",
            f"Simplify {prompt_text or session_name} to its core essence",
            f"Scale {prompt_text or session_name} to reach more users"
        ]})

@app.route('/chat', methods=['POST'])
def chat():
    """AI chat about the brainstorming session"""
    data = request.json or {}
    context = data.get('context', '')
    message = data.get('message', '')
    history = data.get('history', [])

    print(f"💬 Chat message: {message[:80]}...")

    if model is None:
        return jsonify({"reply": "AI service is not available. Please check the Gemini API configuration."})

    try:
        # Build conversation with context
        conversation = f"""{context}

Conversation history:
{chr(10).join(f"{'User' if h.get('role') == 'user' else 'AI'}: {h.get('content', '')}" for h in history[-10:])}

User: {message}

Respond helpfully and concisely. If asked about the session's ideas, reference specific ideas from the context above."""

        response = model.generate_content(conversation)
        reply = response.text.strip()
        print(f"✅ Chat reply generated ({len(reply)} chars)")
        return jsonify({"reply": reply})
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"reply": "Sorry, I couldn't process that request. Please try again."})

@app.route('/advanced-cluster', methods=['POST'])
def advanced_cluster():
    """Advanced clustering using DBSCAN for density-based grouping"""
    data = request.json or {}
    ideas = data.get('ideas', []) or []

    print(f"🔬 Advanced clustering with DBSCAN for {len(ideas)} ideas...")

    embeddings = []
    valid_ideas = []

    for idea in ideas:
        emb = idea.get('embedding')
        if emb and isinstance(emb, (list, tuple, np.ndarray)) and len(emb) > 0:
            norm_emb = normalize_embedding(emb)
            embeddings.append(norm_emb)
            valid_ideas.append(idea)
        else:
            content = idea.get('content', '') or ''
            gen_emb = generate_embedding(content)
            gen_emb = normalize_embedding(gen_emb)
            embeddings.append(gen_emb)
            valid_ideas.append(idea)

    try:
        X = np.vstack([np.asarray(e, dtype=float) for e in embeddings])
    except Exception as e:
        print(f"Error building embedding matrix for DBSCAN: {e}")
        X = np.array([normalize_embedding(e) for e in embeddings], dtype=float)

    # If there are too few points for DBSCAN, return empty clusters
    if len(valid_ideas) == 0:
        return jsonify({"clusters": []})

    try:
        dbscan = DBSCAN(eps=0.3, min_samples=2, metric='cosine')
        labels = dbscan.fit_predict(X)
    except Exception as e:
        print(f"DBSCAN error: {e}")
        labels = np.array([-1] * len(valid_ideas))

    unique_labels = set(int(l) for l in labels)
    clusters = []

    for label in unique_labels:
        if label == -1:
            continue

        cluster_indices = [j for j in range(len(valid_ideas)) if int(labels[j]) == label]
        cluster_ideas = [valid_ideas[j] for j in cluster_indices]
        idea_texts = [idea.get('content', '') for idea in cluster_ideas]

        clusters.append({
            "label": f"Theme {label + 1}",
            "ideas": [idea.get('id') for idea in cluster_ideas],
            "color": CLUSTER_COLORS[label % len(CLUSTER_COLORS)],
            "algorithm": "dbscan"
        })

    print(f"✅ DBSCAN created {len(clusters)} density-based clusters")
    return jsonify({"clusters": clusters})

if __name__ == '__main__':
    print("🚀 Starting MindQuest AI Service...")
    print(f"🧠 ML Models: HashingVectorizer (dim={EMBED_DIM}), K-Means, DBSCAN")
    if model:
        print("🤖 AI Model: Google Gemini Pro (gemini-1.0-pro)")
    else:
        print("⚠️ AI Model: Google Gemini Pro FAILED to initialize. Endpoints will use fallback logic.")
    app.run(host='0.0.0.0', port=5001, debug=True)