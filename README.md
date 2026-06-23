# ValoStore

ValoStore is a sleek, modern, and highly-responsive web dashboard built for Valorant players. It allows you to check your Daily Store, Match History, Inventory, and Account Information without having to launch the game client.

## ✨ Features

- 🔐 **Secure Login Methods**: Supports both Riot Mobile QR Code scanning and traditional Username/Password (with 2FA support).
- 🛒 **Daily Store**: View your personalized daily store offers, complete with skin images and VP prices (Powered by Riot's Storefront v3 API).
- ⚔️ **Match History**: Access a detailed, `tracker.gg`-style match history. View complete scoreboards, precise K/D/A, Headshot percentages, and Average Combat Scores (ACS) for all 10 players in a match.
- 🎒 **Inventory & Account**: View your loadout, currencies (VP, Radianite, Kingdom Credits), level, and Rank. Your Player Card banner is dynamically displayed in your profile!
- 🎨 **Premium UI/UX**: Built with Next.js, Tailwind CSS, and modern `lucide-react` icons for a seamless, esports-ready aesthetic.
- 🌐 **Multi-Language Support**: Built-in i18n support.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: SQLite (via `better-sqlite3`) for local caching of API responses.
- **APIs**:
  - Custom Riot Client Auth implementation
  - Riot Games PD / Player Data APIs
  - [HenrikDev Valorant API](https://github.com/Henrik-3/unofficial-valorant-api) (for Match History, MMR, and Account info)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Docker](https://www.docker.com/) & Docker Compose (Optional, for containerized deployment)
- A **HenrikDev API Key** (Required for fetching Match History and Rank data). You can get one from the [HenrikDev Discord](https://discord.gg/henrikdev).

### Setup Instructions

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd ValoStore
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Copy the example environment file to create your own configuration.
   ```bash
   cp .env.example .env
   ```
   Open `.env` and add your HenrikDev API Key:
   ```env
   HENRIK_API_KEY="your_api_key_here"
   ```

### Running the Application

**Option A: Local Development (Node.js)**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**Option B: Docker (Recommended)**
```bash
docker-compose up -d --build
```
This will containerize the application, install all dependencies automatically, and start the app on port 3000. Data (like sessions and caches) will be persistently stored in the `./data` volume directory.

## 📝 Troubleshooting

- **QR Code not scanning**: Ensure your phone brightness is up. The scanning overlay has been optimized to prevent blocking the QR pattern.
- **Match History not loading**: Ensure you have added a valid `HENRIK_API_KEY` to your `.env` file and restarted the server.
- **Docker Cache Issues**: If you modify `.env` or install new `npm` packages, remember to rebuild the Docker image using `docker-compose up -d --build`.

## 🤝 Acknowledgements

Special thanks to [HenrikDev](https://github.com/Henrik-3) for the robust unofficial Valorant API.
