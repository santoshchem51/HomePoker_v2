# PokePot - Poker Session Manager

PokePot is a React Native mobile application for managing poker sessions, tracking player buy-ins/cash-outs, and handling settlements with voice command integration and WhatsApp sharing capabilities.

## 🚀 Features

- **Session Management**: Create and manage poker sessions
- **Player Tracking**: Track buy-ins, cash-outs, and balances
- **Voice Commands**: Voice-controlled transaction entry
- **Settlement Calculations**: Automatic settlement calculations with verification
- **Database**: Local SQLite database with WAL mode for performance
- **Health Monitoring**: Built-in health check and status monitoring

## 📋 Requirements

- **Node.js**: 18+ (see `engines` in package.json)
- **React Native**: 0.73+ with TypeScript 5.3+
- **iOS**: Xcode 14+ / iOS 13+ 
- **Android**: Android SDK 31+ / API Level 31+

## 🛠 Development Setup

### Prerequisites

1. Complete the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment)
2. Ensure you have the required Node.js version: `node --version` should show 18+

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd HomePoker_v2

# Install dependencies
npm install

# iOS only: Install CocoaPods dependencies
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# In a new terminal, run the app
npm run android  # for Android
npm run ios      # for iOS
```

## 📱 Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on Android emulator/device |
| `npm run ios` | Run on iOS simulator/device |
| `npm test` | Run Jest tests with coverage |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint code analysis |
| `npm run build:android` | Build Android release APK |
| `npm run build:ios` | Build iOS archive for App Store |
| `npm run clean` | Clean React Native cache |

### Development Environment

**Metro Bundler**: Starts on http://localhost:8081
- Hot reload enabled by default
- Fast refresh for React components
- Error overlay for debugging

**Database**: SQLite with WAL mode
- Local development database: `pokepot.db`
- Schema located in: `database/schema.sql`
- Health check available in app

**Health Check**: Available at app startup
- App status and version info
- Database connectivity verification
- System information display

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
