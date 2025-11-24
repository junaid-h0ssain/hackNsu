# Crime Reporting and Community Verification Platform

A real-time web application built with SvelteKit, Firebase, and Google Gemini AI that enables citizens to report crimes with location data and media, allows community verification through voting and commenting, and provides an interactive map visualization of crime data.

## Features

- 🔐 User authentication (email/password and phone/OTP)
- 📍 Crime reporting with location and media uploads
- 🗺️ Interactive map with crime markers and clustering
- 👍 Community verification through upvotes/downvotes
- 💬 Real-time comments and updates
- 🤖 AI-powered content analysis using Google Gemini
- 👮 Moderation and admin features
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI (bits-ui)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini API
- **Maps**: Leaflet with OpenStreetMap
- **Testing**: Vitest + fast-check (property-based testing)

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── reports/       # Crime report components
│   │   ├── map/           # Map components
│   │   ├── moderation/    # Moderation components
│   │   └── ui/            # Reusable UI components
│   ├── services/          # Firebase and API services
│   ├── stores/            # Svelte stores for state management
│   ├── firebase/          # Firebase configuration
│   ├── utils/             # Utility functions and constants
│   └── types/             # TypeScript type definitions
├── routes/                # SvelteKit routes
└── app.css               # Global styles with Tailwind
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Auth, Firestore, and Storage enabled
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Configure your Firebase and Gemini API keys in `.env`

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Building

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Environment Variables

See `.env.example` for required environment variables:

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_GEMINI_API_KEY` - Google Gemini API key

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password and Phone providers
3. Create a Firestore database
4. Enable Firebase Storage
5. Copy your Firebase config to `.env`

## License

MIT
