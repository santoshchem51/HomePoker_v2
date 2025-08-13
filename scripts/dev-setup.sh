#!/bin/bash

# PokePot Development Environment Setup Script
# This script sets up the development environment and launches the app

set -e  # Exit on any error

echo "🚀 PokePot Development Environment Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

# Check if Node.js version is 18 or higher
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
    exit 1
fi
print_success "Node.js version check passed"

# Check if npm dependencies are installed
print_status "Checking npm dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Installing dependencies..."
    npm install
else
    print_success "Dependencies already installed"
fi

# Create .env file if it doesn't exist
print_status "Setting up environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Created .env file from .env.example"
else
    print_success ".env file already exists"
fi

# Run TypeScript type checking
print_status "Running TypeScript type checking..."
npm run typecheck
print_success "TypeScript type checking passed"

# Run ESLint
print_status "Running ESLint code analysis..."
npm run lint
print_success "ESLint analysis passed"

# Run tests
print_status "Running test suite..."
npm test -- --watchAll=false
print_success "All tests passed"

# Check Android/iOS setup
print_status "Checking platform availability..."

# Check for Android
if command -v adb &> /dev/null; then
    ANDROID_DEVICES=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)
    if [ "$ANDROID_DEVICES" -gt 0 ]; then
        print_success "Android device/emulator detected"
        ANDROID_AVAILABLE=true
    else
        print_warning "No Android devices/emulators detected"
        ANDROID_AVAILABLE=false
    fi
else
    print_warning "Android Debug Bridge (adb) not found"
    ANDROID_AVAILABLE=false
fi

# Check for iOS (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v xcrun &> /dev/null; then
        if xcrun simctl list devices | grep -q "Booted"; then
            print_success "iOS Simulator detected"
            IOS_AVAILABLE=true
        else
            print_warning "No iOS Simulators running"
            IOS_AVAILABLE=false
        fi
    else
        print_warning "Xcode command line tools not found"
        IOS_AVAILABLE=false
    fi
else
    print_status "iOS development not available on this platform"
    IOS_AVAILABLE=false
fi

# Start Metro bundler in background
print_status "Starting Metro bundler..."
npm start &
METRO_PID=$!

# Wait for Metro to start
print_status "Waiting for Metro bundler to initialize..."
sleep 10

# Check if Metro is running
if kill -0 $METRO_PID 2>/dev/null; then
    print_success "Metro bundler started successfully (PID: $METRO_PID)"
else
    print_error "Failed to start Metro bundler"
    exit 1
fi

print_success "Development environment setup complete!"
echo ""
echo "📱 Next Steps:"
echo "=============="

if [ "$ANDROID_AVAILABLE" = true ]; then
    echo "For Android: npm run android"
fi

if [ "$IOS_AVAILABLE" = true ]; then
    echo "For iOS: npm run ios"
fi

echo ""
echo "🛠 Development Commands:"
echo "======================="
echo "npm run typecheck    # TypeScript validation"
echo "npm run lint        # ESLint analysis"
echo "npm test           # Run tests"
echo "npm run clean      # Clean caches"
echo ""

echo "🔍 Debugging:"
echo "============="
echo "Health Check: Available in the app after launch"
echo "Dev Menu: Shake device or Ctrl+M (Android) / Cmd+D (iOS)"
echo "Reload: Press 'R' twice or use dev menu"
echo ""

echo "📚 Documentation:"
echo "================="
echo "README.md        # Project overview and quick start"
echo "DEVELOPMENT.md   # Detailed development guide"
echo "ONBOARDING.md    # Developer onboarding checklist"
echo ""

print_success "Happy coding! 🎉"

# Keep the script running to maintain Metro
echo "Press Ctrl+C to stop Metro bundler and exit"
wait $METRO_PID