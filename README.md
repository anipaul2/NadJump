# NadJump - Mission 7 Game 🎮

A Farcaster miniapp game built for Monad Games ID integration. Jump through platforms, compete on the leaderboard, and share your scores!

## 🚀 Live Demo

- **Game URL**: https://nad-jump.vercel.app/
- **Leaderboard**: https://monad-games-id-site.vercel.app/leaderboard

## ✨ Features

- 🎮 **Platform Jumping Game**: Navigate through dynamic platforms with physics-based gameplay
- 🏆 **Leaderboard Integration**: Compete with other players via Monad Games ID
- 📱 **Farcaster Miniapp**: Native integration with Farcaster for sharing and social features
- 🔐 **Secure Score Submission**: Server-side validation prevents score manipulation
- 🎨 **Animated Graphics**: Smooth animations with particle effects
- 📊 **Real-time Stats**: View your progress and blockchain statistics

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Privy with Monad Games ID integration
- **Blockchain**: Monad Testnet with Viem
- **Social**: Farcaster SDK for miniapp functionality
- **Deployment**: Vercel

## 🎯 Game Mechanics

### Scoring System
- **Platform Landing**: +1 point per successful landing
- **Spring Platforms**: +1 bonus point (blue platforms)
- **Breakable Platforms**: +2 bonus points (orange platforms)
- **Manual Jumps**: +0.5 points (skill-based bonus)

### Special Platforms
- **Green**: Normal platforms
- **Red**: Moving platforms
- **Blue**: Spring platforms (extra jump height)
- **Orange**: Breakable platforms (disappear after use)

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- Git
- Vercel account
- Privy account with Monad Games ID enabled

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mission7-example-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required values:
   ```env
   WALLET_PRIVATE_KEY=0x... # Wallet with GAME_ROLE permission
   API_SECRET=... # Generate with: openssl rand -hex 32
   NEXT_PUBLIC_PRIVY_APP_ID=... # From Privy Dashboard
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Import your GitHub repository to Vercel
   - Vercel will auto-detect Next.js configuration

2. **Environment Variables**
   Set these in Vercel Dashboard → Settings → Environment Variables:
   
   | Variable | Description |
   |----------|-------------|
   | `WALLET_PRIVATE_KEY` | Wallet with GAME_ROLE on Monad contract |
   | `API_SECRET` | Random 64-char hex string |
   | `NEXT_PUBLIC_PRIVY_APP_ID` | Your Privy App ID |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |

3. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

## 🔗 Monad Games ID Integration

### Registration Process

1. **Register your game** on the smart contract:
   - Contract: `0xceCBFF203C8B6044F52CE23D914A1bfD997541A4`
   - Use `registerGame` function with your game details

2. **Request GAME_ROLE** permission for your wallet
   - Contact Monad Games ID team or
   - Admin grants permission automatically

3. **Test score submission** once permissions are granted

### API Endpoints

- `POST /api/submit-score` - Submit player scores securely
- `GET /api/get-player-data` - Get total player statistics  
- `GET /api/get-player-data-per-game` - Get game-specific stats

## 📱 Farcaster Miniapp Features

### SDK Integration
- Automatic splash screen handling with `sdk.actions.ready()`
- User context and profile integration
- Compose cast functionality for sharing scores

### Share Functionality
Players can share their scores directly to Farcaster:
```
🎮 Just scored 42 points in NadJump! Can you beat my score? 🚀 #MonadGames
```

### Manifest File
Located at `/.well-known/farcaster.json` for proper miniapp discovery.

## 🔒 Security Features

- ✅ **Server-side score validation** - Prevents client-side manipulation
- ✅ **Rate limiting** - 10 requests per minute per IP
- ✅ **Origin validation** - Only accepts requests from your domain
- ✅ **Session authentication** - Wallet-based user verification
- ✅ **Request deduplication** - Prevents duplicate submissions
- ✅ **Input sanitization** - Validates all user inputs

## 🎨 Game Assets

- **Player Character**: Animated Monad logo with physics
- **Background**: Animated GIF watermark with sky gradient
- **Platforms**: Color-coded with different behaviors
- **Particles**: Landing and jump effect animations
- **UI**: Responsive design optimized for mobile/desktop

## 📊 Monitoring & Analytics

### Available Metrics
- Player scores and achievements
- Platform landing statistics  
- Game session duration
- Score submission success rates

### Debug Features
- Real-time blockchain stats display
- Console logging for development
- Error handling with user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- **Documentation**: See `DEPLOYMENT.md` for detailed setup
- **Issues**: Open an issue on GitHub
- **Community**: Join the Monad Games Discord

---

Built with ❤️ for Monad Mission 7 🚀
