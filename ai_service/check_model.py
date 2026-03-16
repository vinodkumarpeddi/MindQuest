import google.generativeai as genai
import os

# Make sure your GEMINI_API_KEY is set in your environment
# Correct
genai.configure(api_key="AIzaSyBDsHubIKHikIth-VKKaytcSClL9sO7u6A")

print("Fetching available models for your API key...")

try:
    for m in genai.list_models():
        # Check if the model supports the 'generateContent' method
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"An error occurred: {e}")