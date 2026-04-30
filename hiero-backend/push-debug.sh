#!/bin/bash

echo "📊 Pushing Analysis Debugging Updates..."

cd "/Users/jaswanthkumar/Desktop/shared folder/hiero backend"

echo "🔍 Checking git status..."
git status

echo "📝 Adding all changes..."
git add .

echo "💾 Committing changes..."
git commit -m "Add comprehensive logging to debug backend/frontend data flow for analysis results"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Done!"