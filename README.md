# Grubl 🍔

A swipe-based food recommender app for Android.

Enter a location and your preferences, then swipe through nearby places:

- **Swipe right** to open the place in Google Maps.
- **Swipe left** to skip it.
- **Swipe down** to add it to your shortlist, which you can review anytime via the **Shortlisted** button.

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Your Google API Key

The app uses the Google Geocoding and Places APIs. Copy the example env file and add your key:

```bash
cp .env.example .env
```

Then set `EXPO_PUBLIC_GOOGLE_API_KEY` in `.env`. You can create a key in the
[Google Cloud Console](https://console.cloud.google.com/) with the **Geocoding API**
and **Places API (New)** enabled.

### 3. Start the Expo Development Server

```bash
npx expo start
```

### 4. Set Up an Android Emulator or Use a Physical Device

- **Emulator:**
  - Open Android Studio.
  - Go to "Virtual Device Manager".
  - Start an Android Virtual Device (AVD).
- **Physical Device:**
  - Connect your Android phone via USB and enable USB debugging.

### 5. Launch the App

- In the Expo CLI terminal, press `a` to open the app on your Android emulator or connected device.

## 📝 Notes

- **Only Android is supported for now.**
- Make sure you have [Node.js](https://nodejs.org/), [npm](https://www.npmjs.com/), and [Expo CLI](https://docs.expo.dev/get-started/installation/) installed.
- If you encounter issues with the emulator, try restarting Android Studio or your computer.
