#!/bin/bash

# Publishing script for n8n-nodes-pdf-parse
# Usage: ./publish.sh [patch|minor|major]

set -e

VERSION_TYPE=${1:-patch}

echo "🔍 Pre-publish checks..."

# Check if logged in
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to npm. Please run: npm login"
    exit 1
fi

# Check git status
if [[ -n $(git status -s) ]]; then
    echo "❌ Working directory not clean. Commit or stash changes first."
    exit 1
fi

# Pull latest
echo "📥 Pulling latest changes..."
git pull

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building project..."
npm run build

# Run tests if available
if [ -f "test-node.js" ]; then
    echo "🧪 Running tests..."
    node test-node.js
fi

# Version bump
echo "📝 Bumping version ($VERSION_TYPE)..."
npm version $VERSION_TYPE

# Publish
echo "🚀 Publishing to npm..."
npm publish --access public

# Push to git
echo "📤 Pushing to git..."
git push && git push --tags

echo "✅ Successfully published!"
echo "📦 Package: $(node -p "require('./package.json').name")"
echo "📌 Version: $(node -p "require('./package.json').version")"
echo ""
echo "🔗 View on npm: https://www.npmjs.com/package/$(node -p "require('./package.json').name")"
echo ""
echo "📥 Install with: npm install -g $(node -p "require('./package.json').name")"