# 📱 Royal Pharmacy Mobile

A secure, premium companion mobile application built with **React Native (Expo)**, **TypeScript**, and **Tailwind CSS (NativeWind)**. It is designed to work in tandem with the **MERN Web-Based Royal Pharmacy System**, enabling on-the-field staff and administrators to log returns, collect cash payments, clear cheques, and manage directories on the go.

---

## 📥 Download APK

[⬇️ Download Latest APK](https://expo.dev/accounts/hilme/projects/royal-pharmacy-mobile/builds/8adc3d76-68cf-479a-b51b-570efc69ba55)

---

## ✨ Key Features

* 📦 **Product Returns Ledger**: Log expired, damaged, or wrong product delivery returns directly from pharmacies with dedicated reason lists.
* 💵 **Cash Payments Tracker**: Record cash collections from pharmacies and sync transaction amounts instantly.
* 💳 **Cheque Clearance Manager**: Document cheque details, images, bank information, and status updates.
* 🔄 **Real-Time Synchronisation**: Lightweight 3-second background polling loop integrated in `AuthContext` to sync profile edits, uploads, and deletions in real-time between Web and Mobile.
* ⚡ **On-Device Image Optimization**: Uses `expo-image-manipulator` to automatically resize images to `150x150` pixels and apply a `0.5` compression scale before sending them, dropping upload sizes from 4MB to ~15KB (reduces upload time to < 1s).
* 🛡️ **Cross-Platform Safe layouts**: 
  * Dynamic Safe-Area padding on the bottom navigation bar to prevent overlap with Android's system navigation/software buttons on all screens.
  * Standardized modal input `KeyboardAvoidingView` set to `"padding"`, preventing Android's keyboard from covering inputs or action buttons.
  * Custom Android-compatible self-deletion modal verifying inputs locally.
* 🌓 **Dark & Light Modes**: Full styling support across all directories.

---

## 🛠️ Technology Stack

* **Framework**: React Native (via Expo SDK 54)
* **Language**: TypeScript
* **Navigation**: Expo Router (File-based routing)
* **Styling**: NativeWind (Tailwind CSS for React Native)
* **Icons**: Expo Vector Icons (Ionicons)
* **Local Storage**: AsyncStorage
* **Networking**: Axios (with custom auth header interceptors)

---

## 🚀 Getting Started

### 📋 Prerequisites

* Node.js (v18+)
* Expo Go app installed on your Android/iOS mobile device (available in Google Play Store / App Store)
* Local or deployed MERN backend server running

### 🔧 Installation & Local Run

1. **Navigate to the Project Directory**:
```bash
   cd C:\Users\USER\Desktop\royal-pharmacy-mobile
```

2. **Install Dependencies**:
```bash
   npm install
```

3. **Verify API Configuration**:
   Open [src/utils/api.ts](src/utils/api.ts) and verify the `baseURL` points to your backend:
```typescript
   // Example configuration (use your active server URL)
   baseURL: 'https://web-based-royal-pharmacy-system.vercel.app/api'
```

4. **Start the Expo Development Server**:
   Run the dev command on a dedicated port (e.g., `8085`) to avoid port conflicts:
```bash
   npx expo start --port 8085 --clear
```

5. **Scan & Open in Expo Go**:
   * Open the **Expo Go** app on your phone.
   * Scan the QR code printed in your computer's terminal.
   * The bundle will compile locally and load the application instantly on your device!

---

## 📦 Building Standalone Release APKs (EAS Build)

The project is fully configured to compile standalone `.apk` or `.aab` bundles through Expo Application Services (EAS):

1. Make sure you are logged into your Expo account:
```bash
   npx eas-cli login
```

2. Start the compilation build:
```bash
   npx eas-cli build --platform android --profile preview
```

3. Once compiled, Expo will provide a QR code and a direct link to download the `.apk` package to your Android device.

---

## 📁 Project Structure

```text
royal-pharmacy-mobile/
├── assets/                  # App icon, adaptive icon, and splash screen resources
├── src/
│   ├── app/                 # Expo Router Screens (tab pages & auth screens)
│   │   ├── (auth)/          # Auth Stack (login, register, forgot password)
│   │   ├── (tabs)/          # Bottom Navigation Screens (dashboard, returns, cash, cheques, profile)
│   │   └── _layout.tsx      # Root Layout configuration
│   ├── context/             # Global Context Hooks (AuthContext, ThemeContext)
│   ├── components/          # Shared layout components (AutoComplete sheets)
│   └── utils/               # Axios API configuration & utility constants
├── app.json                 # Expo Project metadata & plugin config
├── eas.json                 # EAS build environments (preview, production)
└── package.json             # Package scripts & library dependencies
```
