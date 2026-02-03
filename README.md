# Chain Reaction - Multiplayer Game

A real-time multiplayer Chain Reaction game built with React, Node.js, and Socket.IO. Play with friends across different computers!

## 🎮 Game Overview

Chain Reaction is a strategic board game where players take turns placing orbs on a grid. When a cell reaches its critical mass, it explodes, sending orbs to adjacent cells and converting them to the player's color. The last player with orbs on the board wins!

## 🚀 Features

- **Real-time Multiplayer**: Play with 2-8 players across different computers
- **Room-based System**: Create or join game rooms with unique codes
- **Smooth Animations**: Satisfying explosion and chain reaction effects
- **Responsive Design**: Works on desktop and mobile devices
- **Chat System**: Communicate with other players during the game

## 🛠️ Tech Stack

### Frontend
- React with TypeScript
- Socket.IO Client
- Framer Motion (animations)
- Tailwind CSS (styling)

### Backend
- Node.js with Express
- Socket.IO (WebSocket server)
- Redis (state management)
- TypeScript

## 📦 Project Structure

```
chain-reaction/
├── frontend/          # React frontend application
├── backend/           # Node.js backend server
├── shared/            # Shared types and utilities
└── README.md
```

## 🏃 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Redis server (for production)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chain-reaction
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

### Development

Run both frontend and backend concurrently:

```bash
# From the root directory
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5000`.

## 🎯 How to Play

1. **Create or Join a Room**: Start by creating a new room or joining an existing one with a room code
2. **Wait for Players**: Wait for other players to join the lobby
3. **Start the Game**: The host can start the game when ready
4. **Place Orbs**: Click on cells to place your orbs
5. **Trigger Chain Reactions**: Fill cells to critical mass to cause explosions
6. **Win the Game**: Be the last player with orbs on the board!

## 📝 Game Rules

- **Critical Mass**: 
  - Corner cells: 2 orbs
  - Edge cells: 3 orbs
  - Interior cells: 4 orbs
- **Valid Moves**: You can only place orbs in empty cells or cells you already own
- **Explosions**: When a cell reaches critical mass, orbs distribute to adjacent cells
- **Conversion**: Explosions convert neighboring cells to your color
- **Elimination**: Players are eliminated when they have no orbs left (after the first round)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Inspired by the classic Chain Reaction board game.

---

**Status**: In Development  
**Version**: 0.1.0  
**Last Updated**: February 3, 2026
