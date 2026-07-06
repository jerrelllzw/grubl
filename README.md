# Grubl 🍔

A swipe-based food recommender app for Android.

Set your location and preferences, then swipe through nearby places:

- **Swipe right (YES)** to add a place to your shortlist.
- **Swipe left (NO)** to skip it.
- **Undo** rewinds your last swipe if you slipped.

When the deck runs out (or you tap **Shortlist**), Grubl shows your shortlist. Hit
**Pick for me** to let Grubl spin the wheel and choose one, or tap a place
yourself. From the verdict you can **open it in Google Maps**, or tap any other
place in the shortlist to make it the pick instead.

> Grubl deliberately doesn't ask what you're craving — deciding for you is the
> whole point. Set a location and go.

> Places are shown as coloured cards with a cuisine emoji rather than photos —
> the Google Places Photo endpoint is billed separately and intentionally left
> out for now.

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Your Google API Key

Restaurant search and location autocomplete both use the Google **Places API
(New)**. Copy the example env file and add your key:

```bash
cp .env.example .env
```

Then set `EXPO_PUBLIC_GOOGLE_API_KEY` in `.env`. You can create a key in the
[Google Cloud Console](https://console.cloud.google.com/) with the
**Places API (New)** enabled. Without a key the app falls back to a bundled demo
deck (and location autocomplete is disabled).

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
