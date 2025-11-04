#!/bin/bash
# Celestia Arcana Setup Script
# This script installs all dependencies for the project

set -e  # Exit on error

echo "🔮 Celestia Arcana Setup"
echo "======================="
echo ""

# Check Node/Bun
if command -v bun &> /dev/null; then
    echo "✓ Bun found: $(bun --version)"
elif command -v node &> /dev/null; then
    echo "✓ Node.js found: $(node --version)"
else
    echo "✗ Neither Bun nor Node.js found"
    echo "  Please install Bun from https://bun.sh or Node.js from https://nodejs.org"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo "✓ Python found: $(python3 --version)"
elif command -v python &> /dev/null; then
    echo "✓ Python found: $(python --version)"
else
    echo "✗ Python not found"
    echo "  Please install Python 3.6+ from https://python.org"
    exit 1
fi

echo ""
echo "Installing JavaScript dependencies..."
if command -v bun &> /dev/null; then
    bun install
else
    npm install
fi

echo ""
echo "Installing Python dependencies..."
if command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
elif command -v pip &> /dev/null; then
    pip install -r requirements.txt
else
    echo "⚠ pip not found, trying python3 -m pip..."
    python3 -m pip install -r requirements.txt
fi

echo ""
echo "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file from .env.example"
    echo "⚠ Please add your OPENAI_API_KEY to .env"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "Testing Python dependencies..."
python3 -c "import openai; print('✓ openai installed')" 2>&1 || echo "✗ openai failed (try: pip3 install openai)"
python3 -c "import requests; print('✓ requests installed')" 2>&1 || echo "✗ requests failed (try: pip3 install requests)"

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your OPENAI_API_KEY to .env file"
echo "2. Run: bun run dev (or npm run dev)"
echo "3. Visit: http://localhost:5173"
echo ""
echo "May your readings be luminous! 🔮"
