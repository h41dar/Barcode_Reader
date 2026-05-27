# Barcode Reader — React Native (Expo) 📱🔍

**A lightweight mobile app for scanning barcodes and QR codes, saving results locally, and managing scan history.**

---

## Overview ✅

Barcode Reader is a mobile-first application built with **React Native** (Expo). It lets users scan barcodes and QR codes in real time, store scan results locally using SQLite, and manage saved scans through a simple, themed UI. The project is intentionally small and modular—great for learning or as a starting point for a production app.

---

## Features ✨

- **Real-time barcode & QR code scanning** using the device camera
- **Local persistence** with SQLite (`database/SQLite.tsx`) for saving and querying scan history
- **Save & delete** scan entries (history management)
- **Themed UI** with reusable components (`components/*`) and safe-area support
- **Cross-platform** (iOS & Android) via Expo
- **Modular codebase** ideal for customization and learning

---

## Quick Start ⚡

1. Clone the repo:

```bash
git clone <repo-url>
cd barcode_reader
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Start the Expo dev server:

```bash
expo start
```

4. Open the app on a device or simulator and grant Camera permission when prompted.

> Tip: If you plan to run on a physical device, install the Expo Go app from the App Store / Play Store.

---

## Usage 💡

- Open the app and navigate to the **Scan** tab.
- Point the camera at a barcode or QR code — a successful scan will store the result in the local database.
- Visit the **Save** / **Delete** tabs to manage saved entries.

---

## Project Structure 🔧

- `app/` — App routes and screens
- `components/` — Reusable UI components
- `database/SQLite.tsx` — Local persistence logic
- `assets/` — Fonts and images
- `constants/` — Theme and color definitions

---

## Contributing 🤝

Contributions welcome! Feel free to open an issue or submit a pull request. If you add features, please update the README and add tests where appropriate.

---

## License 📄

Add a `LICENSE` file to indicate how you want this project to be used (the **MIT** license is a common choice for open source).

---

If you'd like, I can also add a short GitHub repo description (one-liner) or generate screenshots to include in this README. Let me know which you'd prefer!