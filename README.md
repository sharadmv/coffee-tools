# Coffee Tools

A unified suite of coffee-related tools built with React, TypeScript, and Vite.

## Apps

This repository contains multiple PWAs (Progressive Web Apps) built from the same codebase:

- **Coffee Assistant**: An interactive brewing assistant powered by Gemini Live. (Served at `/coffee-tools/index.html`)
- **Stagg EKG Controller**: A Web Bluetooth controller for the Stagg EKG Pro kettle. (Served at `/coffee-tools/stagg.html`)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build all apps
npm run build
```

## Architecture

- **Multi-Page App (MPA)**: Vite is configured to build multiple entry points (`index.html` and `stagg.html`).
- **Shared Components**: Common UI components are located in `src/components`.
- **Hooks**: Logic for Bluetooth (Acaia, Stagg) and AI (Gemini Live) are encapsulated in React hooks in `src/hooks`.
- **Separate PWAs**: Each app has its own `manifest.json` and `sw.js` in the `public` directory.

## Deployment

The apps are built into the `dist` directory and are designed to be hosted on GitHub Pages or any static site host.