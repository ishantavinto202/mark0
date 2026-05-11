# Getting Started

This project is built using Expo, React Native, Expo Router, and NativeWind.

## Requirements

Before starting, make sure you have installed:

- Node.js (LTS version recommended)
- npm
- Xcode (for iOS development on Mac)
- Android Studio (for Android development)
- Expo Go app on your phone (optional)

---

# Project Setup

## 1. Install Dependencies

Open terminal in the project folder and run:

```bash
npm install
```

---

## 2. Start the Development Server

Run:

```bash
npx expo start
```

This will open the Expo developer tools.

---

# Running the App

## iPhone Simulator

Press:

```bash
i
```

inside the terminal after Expo starts.

You can also open directly from Xcode simulator.

---

## Android Emulator

Press:

```bash
a
```

inside the terminal after Expo starts.

Make sure Android Emulator is already running.

---

## Physical Device

1. Install the Expo Go app
2. Scan the QR code shown in terminal/browser
3. The app will open on your device

---

# Native Build Setup (Outside Expo Go)

This project supports running a full native app build using:

```bash
npx expo run:ios
```

or

```bash
npx expo run:android
```

This creates the native iOS and Android folders automatically.

Use this when:
- Testing native modules
- Using custom native code
- Running libraries that do not work in Expo Go
- Debugging native behavior

---

## First Time Native Setup

### Generate Native Folders

```bash
npx expo prebuild
```

---

## Run iOS App

```bash
npx expo run:ios
```

---

## Run Android App

```bash
npx expo run:android
```

---

# Important Notes About Native Builds

After native folders are created:

```txt
ios/
android/
```

the project becomes a development build workflow instead of pure Expo Go workflow.

If package changes affect native code, run:

```bash
npx expo prebuild
```

again.

---

# Project Structure

```txt
app/            Main application screens and routes
components/     Reusable UI components
assets/         Images, fonts, icons
constants/      Static values and configs
hooks/          Custom React hooks
```

---

# Styling

This project uses NativeWind (Tailwind CSS for React Native).

Example:

```tsx
<View className="flex-1 items-center justify-center bg-black">
  <Text className="text-white">Hello</Text>
</View>
```

---

# Routing

This project uses Expo Router.

Every file inside the `app` folder becomes a screen automatically.

Example:

```txt
app/profile.tsx
```

creates:

```txt
/profile
```

---

# Common Commands

## Start Project

```bash
npx expo start
```

---

## Start With Cache Clear

```bash
npx expo start -c
```

---

## Run Native iOS App

```bash
npx expo run:ios
```

---

## Run Native Android App

```bash
npx expo run:android
```

---

## Rebuild Native Folders

```bash
npx expo prebuild
```

---

## Install New Package

```bash
npx expo install package-name
```

---

# Notes

- Use `expo install` instead of `npm install` for React Native / Expo libraries
- Keep package versions compatible with Expo SDK 53
- Avoid upgrading Expo packages individually unless necessary
- Native builds require Xcode or Android Studio properly installed

---

# Troubleshooting

## Metro Issues / Strange Errors

Run:

```bash
npx expo start -c
```

---

## iOS Build Issues

Inside the `ios` folder run:

```bash
pod install
```

or

```bash
npx pod-install
```

---

## Node Modules Problems

Delete dependencies and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

# Recommended VSCode Extensions

- ES7+ React/Redux snippets
- Tailwind CSS IntelliSense
- Prettier
- ESLint

---

# Tech Stack

- Expo SDK 53
- React Native 0.79
- React 19
- Expo Router
- NativeWind
- TypeScript
- Reanimated
- Zustand
- React Query