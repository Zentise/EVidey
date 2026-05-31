# EVidey ⚡

An EV trip planner for Indian roads. Enter your destination, pick your vehicle, and EVidey calculates the optimal route with real charging stops, charge times, nearby food, and hotel recommendations — all in one app.

---

## Features

- **Trip Planning** — Enter origin & destination with Google Places autocomplete
- **Charging Stop Routing** — Automatically calculates stops based on your vehicle's real-world range
- **Real Charging Stations** — Live data from Open Charge Map API
- **Map View** — Visual route with all charging stop markers
- **Stop Detail** — Arrival/departure battery %, charge time, connector types
- **Nearby Amenities** — Cafes, restaurants, pharmacies within walking distance of each charger
- **Hotel Recommendations** — For car users, nearby hotels within 3 km of each stop
- **Multi-vehicle Support** — Add multiple EVs, switch between them per trip
- **Offline-ready Auth** — Accounts and vehicle data stored locally via AsyncStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 56 (React Native) |
| Navigation | [Expo Router](https://expo.github.io/router) v3 (file-based) |
| Maps | `react-native-maps` with Google Maps |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Storage | `@react-native-async-storage/async-storage` |
| HTTP | Axios |
| Routing API | Google Routes API |
| Places API | Google Places API |
| Charging Data | [Open Charge Map API](https://openchargemap.org/site/develop/api) |
| Language | TypeScript |

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo Go](https://expo.dev/go) app on your phone

### 1. Clone & install

```bash
git clone https://github.com/Zentise/EVidey.git
cd EVidey
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
EXPO_PUBLIC_OCM_API_KEY=your_open_charge_map_key
```

**Getting API keys:**
- **Google Maps** — [Google Cloud Console](https://console.cloud.google.com/apis) → Enable: Maps SDK for Android, Places API, Routes API, Geocoding API
- **Open Charge Map** — [Register here](https://openchargemap.org/site/profile/register) (free)

### 3. Run

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone.

### Share with teammates (no same WiFi needed)

```bash
npx expo start --tunnel
```

---

## Project Structure

```
EVidey/
├── app/
│   ├── (auth)/          # Login, Register, Vehicle Setup
│   ├── (app)/
│   │   ├── (tabs)/      # Home (trip planner), Profile
│   │   └── trip/        # Route map, Stop detail
│   └── _layout.tsx      # Root layout + auth guard
├── services/
│   ├── routeService.ts  # Trip planning logic + Google Routes API
│   ├── chargingService.ts # Open Charge Map + Google Places amenities
│   └── locationService.ts # GPS, geocoding, place autocomplete
├── store/
│   ├── authStore.ts     # User + vehicle state (Zustand + AsyncStorage)
│   └── tripStore.ts     # Current trip + planning state
├── types/               # Shared TypeScript types
└── constants/           # Colors, API config
```

---

## Environment

All API keys are read from `EXPO_PUBLIC_*` environment variables. Expo automatically loads `.env` at startup — no extra setup needed.

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

---

## License

MIT — see [LICENSE](LICENSE)
