# Rapidraw

A real-time collaborative drawing canvas application built with Next.js and Socket.IO.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server (Next.js only)
npm run dev

# Run with integrated WebSocket server
npm run dev:full
```

## Architecture

Rapidraw offers two server modes:

### 1. Integrated Server (`npm run dev:full`)

- Next.js + Socket.IO running on same port (3000)
- Socket.IO path: `/api/socket`
- Best for: Local development, simple deployments

### 2. Separate WebSocket Server

- Next.js on one platform (e.g., Vercel)
- WebSocket server from `websocket-server/` folder (e.g., Render)
- Socket.IO path: `/socket.io`
- Best for: Production, serverless platforms

## Environment Variables

| Variable                    | Description                            | Default                     |
| --------------------------- | -------------------------------------- | --------------------------- |
| `NEXT_PUBLIC_WEBSOCKET_URL` | External WebSocket server URL          | `` (uses integrated server) |
| `ALLOWED_ORIGINS`           | CORS allowed origins (comma-separated) | `*`                         |

## Features

- ✏️ Drawing tools: Rectangle, Circle, Diamond, Line, Arrow, Freehand, Text
- 🎨 Customizable stroke, fill, and background colors
- 🔄 Undo/Redo with Ctrl+Z/Y
- 📦 Save/Open `.rapidraw` files
- 📤 Export as PNG/SVG
- 📥 Import SVG files
- 🌙 Light/Dark/System theme
- 👥 Real-time collaboration
- 🔗 Shareable room links
- ♾️ Infinite canvas with pan/zoom

## Keyboard Shortcuts

| Key            | Action         |
| -------------- | -------------- |
| `V`            | Select tool    |
| `R`            | Rectangle      |
| `C`            | Circle         |
| `D`            | Diamond        |
| `L`            | Line           |
| `A`            | Arrow          |
| `P`            | Pen (freehand) |
| `T`            | Text           |
| `E`            | Eraser         |
| `?`            | Show shortcuts |
| `Ctrl+Z`       | Undo           |
| `Ctrl+Y`       | Redo           |
| `Ctrl+S`       | Save           |
| `Ctrl+Shift+S` | Save As        |

## Scripts

| Script               | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Next.js development server         |
| `npm run dev:full`   | Integrated Next.js + Socket.IO     |
| `npm run build`      | Production build                   |
| `npm run start`      | Start Next.js production           |
| `npm run start:full` | Start integrated production server |
