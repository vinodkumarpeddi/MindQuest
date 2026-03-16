import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

export async function callAIService(endpoint, data) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}${endpoint}`, data, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  AI service not available. Start Python service on port 5000');
    } else {
      console.error('AI service error:', error.message);
    }
    throw new Error('AI service unavailable');
  }
}
