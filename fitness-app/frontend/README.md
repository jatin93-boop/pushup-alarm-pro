# Fitness tracker frontend (React Native / Expo)

## Setup

```bash
npm install
npx expo install expo-camera expo-barcode-scanner expo-image-picker  # ensures native versions match your Expo SDK
```

Edit `src/api/client.ts` and set `BASE_URL` to your backend's address. If
you're testing on a physical phone via Expo Go, `localhost` won't work --
use your computer's LAN IP (e.g. `http://192.168.1.23:8000`).

Run it:

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `a` / `i` for an emulator.

## What's implemented vs stubbed

**Fully implemented:**
- Navigation shell (Onboarding → Dashboard/Scan/Plan tabs)
- Onboarding form that registers a user against the backend
- Barcode scanning via `expo-barcode-scanner`, calls `/food/barcode/{code}`
- Meal photo capture via `expo-image-picker`, calls `/food/recognize`
- Dashboard pulling live macro targets from the backend
- Plan screen showing current targets + the adaptive engine's explanation text

**Stubbed, needs wiring up:**
- Auth/session state -- `DEMO_USER_ID` is hardcoded in `DashboardScreen.tsx`
  and `PlanScreen.tsx`. Replace with real auth (store a JWT + user id after
  login, e.g. with `AsyncStorage` or a context provider).
- Portion-size confirmation after a photo scan -- `ScanFoodScreen.tsx` shows
  raw results but doesn't yet let the user adjust grams before calling `logFood()`.
- Daily score display -- `getDailyScore()` exists in the API client but no
  screen calls it yet.
- Training plan display on the Plan screen.

## Project structure

```
App.tsx
src/
  api/client.ts        - axios client + typed API calls
  navigation/RootNavigator.tsx
  screens/
    OnboardingScreen.tsx
    DashboardScreen.tsx
    ScanFoodScreen.tsx
    PlanScreen.tsx
```
