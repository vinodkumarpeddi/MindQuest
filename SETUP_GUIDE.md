# MindQuest - Complete Setup Guide

This guide will walk you through setting up MindQuest from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#mongodb-atlas-setup)
3. [Gemini API Key](#gemini-api-key)
4. [Project Installation](#project-installation)
5. [Running the Application](#running-the-application)
6. [Testing the Features](#testing-the-features)
7. [Common Issues](#common-issues)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** v18 or higher - [Download](https://nodejs.org/)
- **Python** 3.9 or higher - [Download](https://www.python.org/)
- **Git** - [Download](https://git-scm.com/)
- A text editor (VS Code recommended)
- Terminal/Command Prompt access

Verify installations:
```bash
node --version    # Should show v18+
python --version  # Should show 3.9+
npm --version
```

---

## MongoDB Atlas Setup

### Option 1: Use Provided Credentials (Quick Start)
The project comes with pre-configured MongoDB credentials in the `.env` file. You can use these for testing.

### Option 2: Create Your Own (Recommended for Production)

1. **Sign up for MongoDB Atlas**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Try Free" and create an account

2. **Create a Cluster**
   - Choose "FREE" tier
   - Select a cloud provider (AWS recommended)
   - Choose a region close to you
   - Click "Create Cluster"

3. **Configure Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `mindquest_user`
   - Password: Generate a secure password
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" (Deployments)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `mindquest`

Example:
```
mongodb+srv://mindquest_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mindquest
```

---

## Gemini API Key

### Option 1: Use Provided Key (Quick Start)
The project includes a test API key in `.env`. This is for demonstration only.

### Option 2: Get Your Own Key (Recommended)

1. **Visit Google AI Studio**
   - Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select "Create API key in new project"
   - Copy the generated key

3. **Important Notes**
   - Keep your API key secure
   - Don't commit it to version control
   - Free tier includes generous limits
   - Monitor usage at [console.cloud.google.com](https://console.cloud.google.com)

---

## Project Installation

### 1. Clone or Download Project
```bash
git clone <repository-url>
cd mindquest
```

Or download and extract the ZIP file.

### 2. Install Node.js Dependencies
```bash
npm install
```

This installs all frontend and backend JavaScript packages.

### 3. Install Python Dependencies
```bash
cd ai_service
pip install -r requirements.txt
cd ..
```

Or if you have multiple Python versions:
```bash
cd ai_service
python -m pip install -r requirements.txt
cd ..
```

### 4. Configure Environment Variables

The `.env` file is already created. Update it if needed:

```env
MONGO_URI=mongodb+srv://manikantachapala1573:AHkKzoxgKaHmkxie@cluster0.drbsc5k.mongodb.net/mindquest
GEMINI_API_KEY=AIzaSyBDsHubIKHikIth-VKKaytcSClL9sO7u6A
JWT_SECRET=mindquest_secret_key_2025_brainstorming_ai
PORT=3001

VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_AI_SERVICE_URL=http://localhost:5000
```

**Production Settings**: For production, update URLs to your deployed services.

---

## Running the Application

You have two options:

### Option A: Run All Services at Once (Easiest)

```bash
npm run start:all
```

This starts:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:3001`
- AI Service on `http://localhost:5000`

### Option B: Run Services Separately

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

**Terminal 3 - AI Service:**
```bash
npm run ai-service
```

### Verify Services

Check these URLs in your browser:
- Frontend: http://localhost:5173 (should show login page)
- Backend: http://localhost:3001/health (should show JSON)
- AI Service: http://localhost:5000/health (should show JSON)

---

## Testing the Features

### 1. Create Account
1. Go to http://localhost:5173
2. Click "Don't have an account? Sign up"
3. Enter:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Create Account"

### 2. Create a Session
1. You'll land on the Lobby page
2. Click "New Session"
3. Enter:
   - Name: "Product Ideas"
   - Description: "Brainstorm new product features"
   - Keep "Public" checked
4. Click "Create"

### 3. Add Ideas
1. Click "Add Idea" button
2. Type: "Mobile app for iOS and Android"
3. Click "Add"
4. Repeat to add more ideas:
   - "Dark mode theme"
   - "Push notifications"
   - "User profiles with avatars"
   - "Social media sharing"

### 4. Test AI Features

**Duplicate Detection:**
1. Try adding "Mobile app for iPhone" (similar to first idea)
2. Notice the orange border and similarity percentage

**AI Idea Generation:**
1. Click "AI Generate"
2. Enter prompt: "innovative features for a mobile app"
3. Click "Generate"
4. Watch as 5 AI-generated ideas appear

**Clustering:**
1. Once you have 5+ ideas, click "Cluster"
2. Wait for AI to group similar ideas
3. Ideas will change colors based on their cluster
4. Click grid icon to view cluster details

**Voting:**
1. Click thumbs up icon on your favorite ideas
2. Vote multiple times on different ideas

**Reactions:**
1. Click smile icon on an idea
2. Choose an emoji reaction

**Session Summary:**
1. Click the document icon in toolbar
2. Click "Generate Summary"
3. Wait for AI to analyze all ideas
4. Read the executive summary and key insights
5. Download as PDF if desired

### 5. Test Real-Time Features

**If you have a second browser or device:**
1. Open http://localhost:5173 in another browser
2. Login with a different account
3. Join the same session
4. Add/move/vote on ideas in one browser
5. Watch them update instantly in the other browser

---

## Common Issues

### Issue: MongoDB Connection Error
```
Error: getaddrinfo ENOTFOUND cluster0.xxxxx.mongodb.net
```

**Solution:**
- Check your internet connection
- Verify MongoDB Atlas connection string in `.env`
- Ensure IP address is whitelisted in MongoDB Atlas
- Try "Allow Access from Anywhere" in Network Access

### Issue: AI Service Not Responding
```
AI service unavailable
```

**Solution:**
- Ensure Python service is running on port 5000
- Check if port 5000 is already in use
- Verify Python dependencies are installed
- Check console for Python error messages

### Issue: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
- Kill the process using that port:
  ```bash
  # On Mac/Linux:
  lsof -ti:3001 | xargs kill

  # On Windows:
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  ```
- Or change the port in `.env`

### Issue: Module Not Found
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
npm install          # Reinstall Node dependencies
cd ai_service
pip install -r requirements.txt  # Reinstall Python deps
```

### Issue: Clustering Not Working
```
Need at least 3 ideas to cluster
```

**Solution:**
- Add at least 3 unique ideas before clustering
- Ensure AI service is running
- Check browser console for detailed errors

### Issue: Socket Connection Failed
```
WebSocket connection failed
```

**Solution:**
- Ensure backend is running on port 3001
- Check `VITE_SOCKET_URL` in `.env`
- Clear browser cache and reload
- Check browser console for CORS errors

### Issue: Build Warnings
```
Some chunks are larger than 500 kB
```

**This is a warning, not an error.** The app still works fine. To optimize:
- Use code splitting with dynamic imports (advanced)
- For production, enable minification and tree-shaking

---

## Development Tips

### Hot Reload
- Frontend: Vite provides instant hot module replacement
- Backend: Restart server after code changes
- AI Service: Restart Python service after changes

### Debug Mode
Add `console.log()` statements to see what's happening:

```javascript
console.log('🔍 User data:', user);
console.log('💡 Ideas:', ideas);
```

### Clear Database
If you want to start fresh:
1. Go to MongoDB Atlas
2. Browse Collections
3. Delete documents from collections
4. Or drop entire collections

### Environment Variables
- `VITE_` prefix exposes variables to frontend
- Never put secrets in `VITE_` variables
- Restart services after changing `.env`

---

## Next Steps

Now that you have MindQuest running:

1. **Explore Features**: Try all AI capabilities
2. **Invite Friends**: Test real-time collaboration
3. **Customize**: Modify colors, add features
4. **Deploy**: Host on Vercel, Render, or Railway
5. **Contribute**: Add new AI models or features

---

## Getting Help

If you're stuck:

1. **Check Console**: Browser DevTools → Console tab
2. **Check Server Logs**: Look at terminal output
3. **Search Issues**: Common problems are documented
4. **Ask for Help**: Create a GitHub issue

---

**You're all set!** Enjoy brainstorming with MindQuest! 🚀

