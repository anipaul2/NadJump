// Game configuration
export const GAME_CONFIG = {
  // Your registered game address (will be set after contract registration)
  GAME_ADDRESS: '0xf5ea577f39318dc012d5Cbbf2d447FdD76c48523',
  
  // Game ID for transaction queue (temporary, will be actual address after registration)
  GAME_ID: '0xf5ea577f39318dc012d5Cbbf2d447FdD76c48523',
  
  // Game settings
  SCORE_SUBMISSION: {
    // Submit score every X points
    SCORE_THRESHOLD: 10,
    
    // Track transactions (actions that cost points/tokens)
    TRANSACTION_THRESHOLD: 1,
  },
  
  // Game metadata
  METADATA: {
    name: 'Monad Jump',
    url: 'https://ap-ignore-jean-turbo.trycloudflare.com/',
    image: 'https://ap-ignore-jean-turbo.trycloudflare.com/game-icon.svg'
  }
} as const;