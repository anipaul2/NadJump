"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { submitPlayerScore } from '@/app/lib/score-api';
import { useFarcaster } from './FarcasterProvider';
import toast from 'react-hot-toast';

// Game constants
let GAME_WIDTH = 800;
let GAME_HEIGHT = 600;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -18;
const PLAYER_SPEED = 6;

// Game objects interfaces
interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  animTime: number;
  squash: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'moving' | 'breakable' | 'spring';
  vx?: number;
  color: string;
  broken?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}



interface MonadJumpGameProps {
  playerAddress?: string;
}

export default function MonadJumpGame({ playerAddress }: MonadJumpGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const monadLogoRef = useRef<HTMLImageElement | null>(null);
  const watermarkRef = useRef<HTMLImageElement | null>(null);
  
  // Store playerAddress in ref to prevent React state issues
  const playerAddressRef = useRef(playerAddress);
  
  // Update ref when prop changes
  useEffect(() => {
    console.log('MonadJumpGame: PlayerAddress prop changed to:', playerAddress);
    playerAddressRef.current = playerAddress;
  }, [playerAddress]);
  
  // Farcaster integration
  const { shareGame, sendNotification } = useFarcaster();
  
  // Removed transaction queue - now using secure server-side API
  
  // Game state
  const gameStateRef = useRef({
    currentState: 'menu', // 'menu', 'playing', 'gameover', 'shop', 'powerups'
    animTime: 0,
    camera: { y: 0, targetY: 0 },
    
    player: {
      x: GAME_WIDTH / 2 - 15,
      y: GAME_HEIGHT - 300, // Much higher starting position, well above water
      vx: 0,
      vy: 0,
      width: 30, // Smaller player
      height: 30,
      onGround: false,
      animTime: 0,
      squash: 1.0
    } as Player,
    
    platforms: [] as Platform[],
    particles: [] as Particle[],
    keys: { left: false, right: false, space: false, wasSpacePressed: false },
    
    // Menu animations
    menuOffset: 0,
    buttonHover: -1,
    
    // Power-ups
    inventory: {} as {[key: string]: number},
    selectedPowerUps: [] as string[],
    
    // Score tracking
    maxHeight: 0,
    lastSubmittedScore: 0,
    finalScore: 0,
    currentScore: 0,
    
    // Rising water level
    waterLevel: GAME_HEIGHT - 100, // Start water level at original position
    highestPlayerY: GAME_HEIGHT - 300, // Track player's highest position
  });

  // Removed transaction queue initialization - now using secure server-side API

  // Load Monad logo
  useEffect(() => {
    const loadLogo = () => {
      const img = new Image();
      img.onload = () => {
        monadLogoRef.current = img;
      };
      img.onerror = () => {
        console.log('Failed to load Monad logo, using fallback');
        monadLogoRef.current = null;
      };
      // Convert SVG to data URL for loading
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none">
        <path d="M25 2C18.651 2 2 18.653 2 25C2 31.347 18.651 48 25 48C31.349 48 48 31.347 48 25C48 18.653 31.349 2 25 2ZM21.75 39.436C18.877 38.647 9.861 24.318 10.646 21.442C11.432 18.565 25.729 9.524 28.602 10.313C31.475 11.102 40.491 25.431 39.706 28.307C38.92 31.184 24.623 40.225 21.75 39.436Z" fill="#836EF9"/>
      </svg>`;
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(blob);
    };
    
    loadLogo();
  }, []);

  // Load watermark image
  useEffect(() => {
    const loadWatermark = () => {
      const img = new Image();
      img.onload = () => {
        console.log('Watermark image loaded successfully');
        watermarkRef.current = img;
      };
      img.onerror = (error) => {
        console.log('Failed to load watermark image:', error);
        // Try without crossOrigin
        const img2 = new Image();
        img2.onload = () => {
          console.log('Watermark loaded without crossOrigin');
          watermarkRef.current = img2;
        };
        img2.onerror = () => {
          console.log('Completely failed to load watermark');
          watermarkRef.current = null;
        };
        img2.src = 'https://media.tenor.com/kiFLnXSFpb0AAAAj/monad-logo.gif';
      };
      img.crossOrigin = 'anonymous';
      img.src = 'https://media.tenor.com/kiFLnXSFpb0AAAAj/monad-logo.gif';
    };
    
    loadWatermark();
  }, []);

  // Generate platforms
  const generatePlatforms = () => {
    const platforms: Platform[] = [];
    
    // Starting platform (above water level, positioned for player to land on)
    platforms.push({
      x: GAME_WIDTH/2 - 75,
      y: GAME_HEIGHT - 280, // Position just below where player starts (player at GAME_HEIGHT - 300)
      width: 150, // Smaller starting platform
      height: 15,
      type: 'normal',
      color: '#22c55e'
    });

    // Generate initial platforms going up
    for (let i = 1; i < 50; i++) {
      generatePlatform(platforms, i);
    }

    return platforms;
  };

  const generatePlatform = (platforms: Platform[], index: number) => {
    const y = GAME_HEIGHT - 350 - (index * 45); // Reduced to 45px vertical spacing for better jumpability
    return generatePlatformForRow(platforms, index, y);
  };

  const generatePlatformForRow = (platforms: Platform[], index: number, y: number, force: boolean = false) => {
    let x;
    
    if (platforms.length > 0) {
      // Position within jumping range of existing platforms
      const recentPlatforms = platforms.slice(-5); // Look at last 5 platforms
      const referencePlatform = recentPlatforms[Math.floor(Math.random() * recentPlatforms.length)];
      const maxJumpDistance = 120; // Reduced horizontal jump range for better gameplay
      const minX = Math.max(0, referencePlatform.x - maxJumpDistance);
      const maxX = Math.min(GAME_WIDTH - 70, referencePlatform.x + maxJumpDistance);
      x = minX + Math.random() * (maxX - minX);
    } else {
      x = Math.random() * (GAME_WIDTH - 70);
    }
    
    // Guarantee platforms for first 8 levels, then 65% chance
    const shouldGenerate = force || index <= 8 || Math.random() < 0.65;
    
    if (shouldGenerate) {
      const type = Math.random() < 0.1 ? 'spring' : 
                   Math.random() < 0.15 ? 'moving' : 
                   Math.random() < 0.05 ? 'breakable' : 'normal';
      
      let color = '#22c55e'; // Green
      if (type === 'moving') color = '#ef4444'; // Red
      else if (type === 'spring') color = '#3b82f6'; // Blue
      else if (type === 'breakable') color = '#f59e0b'; // Orange
      
      platforms.push({
        x,
        y,
        width: 70, // Even smaller platforms 
        height: 12,
        type,
        vx: type === 'moving' ? (Math.random() < 0.5 ? -1.5 : 1.5) : 0,
        color,
        broken: false
      });
      return true;
    }
    return false;
  };

  // Drawing utilities

  const drawGradientRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color1: string, color2: string, radius: number = 0) => {
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    
    ctx.beginPath();
    if (radius > 0) {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  // Draw animated Monad logo player
  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, squash: number = 1.0, animTime: number = 0) => {
    ctx.save();
    ctx.translate(x + 15, y + 15); // Adjust for smaller size
    
    // Apply squash animation
    ctx.scale(1 + (1 - squash) * 0.3, squash);
    
    // Rotation animation for more dynamic look
    const rotation = Math.sin(animTime * 0.02) * 0.1;
    ctx.rotate(rotation);
    
    if (monadLogoRef.current) {
      // Draw the actual Monad logo (smaller)
      ctx.drawImage(monadLogoRef.current, -15, -15, 30, 30);
      
      // Add subtle glow effect
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.shadowColor = '#836EF9';
      ctx.shadowBlur = 10;
      ctx.drawImage(monadLogoRef.current, -15, -15, 30, 30);
      ctx.restore();
    } else {
      // Fallback to the original design if logo fails to load
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, 2 * Math.PI); // Smaller fallback circle
      ctx.fillStyle = '#836EF9';
      ctx.fill();
      
      // Inner design (animated)
      const innerScale = 0.6 + Math.sin(animTime * 0.1) * 0.05;
      ctx.save();
      ctx.scale(innerScale, innerScale);
      
      ctx.beginPath();
      ctx.arc(-5, -3, 12, 0, 2 * Math.PI);
      ctx.fillStyle = '#6B46C1';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(3, 5, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#A78BFA';
      ctx.fill();
      
      ctx.restore();
      
      // Shine effect
      ctx.beginPath();
      ctx.arc(-8, -8, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }
    
    ctx.restore();
  };

  // Render menu
  const renderMenu = (ctx: CanvasRenderingContext2D) => {
    const { animTime, menuOffset, buttonHover } = gameStateRef.current;
    
    // Sky gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Floating clouds effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 5; i++) {
      const x = (i * 200 + animTime * 0.5 + menuOffset) % (GAME_WIDTH + 100);
      const y = 80 + Math.sin(animTime * 0.02 + i) * 20;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 25, y, 25, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 45, y, 20, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Animated player in center
    const playerY = 200 + Math.sin(animTime * 0.05) * 15;
    const playerSquash = 1.0 + Math.sin(animTime * 0.08) * 0.1;
    drawPlayer(ctx, GAME_WIDTH / 2 - 15, playerY, playerSquash, animTime);

    // Game title with shadow
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px Arial';
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText('NadJump', GAME_WIDTH / 2 + 3, 120 + 3);
    
    // Main text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('NadJump', GAME_WIDTH / 2, 120);
    
    ctx.restore();

    // Stats - positioned away from buttons
    ctx.font = '16px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(`Best Score: ${Math.max(score, gameStateRef.current.finalScore)}`, GAME_WIDTH / 2, 160);

    // Leaderboard button (top left to avoid overlaps)
    const leaderboardBtn = { x: 20, y: 20, width: 100, height: 35 };
    const isLeaderboardHover = buttonHover === 0;
    drawGradientRect(ctx, leaderboardBtn.x, leaderboardBtn.y, leaderboardBtn.width, leaderboardBtn.height, 
                     isLeaderboardHover ? '#22c55e' : '#16a34a', 
                     isLeaderboardHover ? '#16a34a' : '#15803d', 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Leaderboard', leaderboardBtn.x + leaderboardBtn.width/2, leaderboardBtn.y + 22);

    // Guidance messages above play button
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4B5563';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('🏆 Login for leaderboard • 📱 Instant play', GAME_WIDTH / 2, 245);
    
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px Arial';
    ctx.fillText('💡 Farcaster mobile: Just play & enjoy!', GAME_WIDTH / 2, 260);

    // Play button - always show, works for everyone
    const playBtn = { x: GAME_WIDTH/2 - 75, y: 290, width: 150, height: 40 };
    const isPlayHover = buttonHover === 1;
    
    drawGradientRect(ctx, playBtn.x, playBtn.y, playBtn.width, playBtn.height,
                     isPlayHover ? '#836EF9' : '#6B46C1',
                     isPlayHover ? '#6B46C1' : '#553C9A', 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('🎮 PLAY', playBtn.x + playBtn.width/2, playBtn.y + 28);
  };

  // Render game
  const renderGame = (ctx: CanvasRenderingContext2D) => {
    const { player, platforms, particles, camera } = gameStateRef.current;
    
    ctx.save();
    
    // Sky gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT - 100);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT - 100);
    
    // Add animated Monad logo watermark if loaded
    if (watermarkRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.25; // Subtle watermark
      const aspectRatio = watermarkRef.current.width / watermarkRef.current.height;
      const watermarkWidth = GAME_WIDTH * 0.6; // Smaller like before - 60% of screen width
      const watermarkHeight = watermarkWidth / aspectRatio;
      
      // Center the watermark in the sky area
      const x = (GAME_WIDTH - watermarkWidth) / 2;
      const y = (GAME_HEIGHT - 100 - watermarkHeight) / 2;
      
      ctx.drawImage(
        watermarkRef.current,
        x, y,
        watermarkWidth,
        watermarkHeight
      );
      ctx.restore();
    }
    
    // Apply camera transform for game objects
    ctx.save();
    
    // Apply camera transform
    ctx.translate(0, camera.y);
    
    // Draw platforms
    platforms.forEach(platform => {
      if (platform.broken) return;
      
      // Platform with gradient and shadow
      ctx.save();
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(platform.x + 3, platform.y + 3, platform.width, platform.height);
      
      // Platform body
      drawGradientRect(ctx, platform.x, platform.y, platform.width, platform.height,
                       platform.color, 
                       platform.color === '#22c55e' ? '#16a34a' : 
                       platform.color === '#ef4444' ? '#dc2626' :
                       platform.color === '#3b82f6' ? '#2563eb' : '#f59e0b', 
                       6);
      
      // Platform type indicator
      if (platform.type === 'spring') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⬆️', platform.x + platform.width/2, platform.y + 15);
      } else if (platform.type === 'moving') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(platform.x + 5, platform.y + 5, platform.width - 10, 3);
      }
      
      ctx.restore();
    });
    
    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });
    
    // Draw player
    drawPlayer(ctx, player.x, player.y, player.squash, gameStateRef.current.animTime);
    
    // Draw rising water level (INSIDE camera transformation so it moves with world)
    const currentWaterLevel = gameStateRef.current.waterLevel;
    const waterGradient = ctx.createLinearGradient(0, currentWaterLevel, 0, currentWaterLevel + 200);
    waterGradient.addColorStop(0, '#1E90FF'); // Bright blue
    waterGradient.addColorStop(0.5, '#0066CC'); // Medium blue
    waterGradient.addColorStop(1, '#003399'); // Dark blue
    ctx.fillStyle = waterGradient;
    
    // Draw wave pattern at rising water level
    ctx.beginPath();
    ctx.moveTo(0, currentWaterLevel);
    for (let x = 0; x <= GAME_WIDTH; x += 20) {
      const waveHeight = Math.sin((x + gameStateRef.current.animTime * 2) * 0.02) * 8;
      ctx.lineTo(x, currentWaterLevel + waveHeight);
    }
    ctx.lineTo(GAME_WIDTH, currentWaterLevel + 200); // Extend water down
    ctx.lineTo(0, currentWaterLevel + 200);
    ctx.closePath();
    ctx.fill();
    
    // Add wave highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, currentWaterLevel);
    for (let x = 0; x <= GAME_WIDTH; x += 20) {
      const waveHeight = Math.sin((x + gameStateRef.current.animTime * 2) * 0.02) * 8;
      ctx.lineTo(x, currentWaterLevel + waveHeight);
    }
    ctx.stroke();
    
    ctx.restore(); // End camera transformation
    
    // UI overlay - top left score with smaller, non-overlapping sizing
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    
    // Score with white outline for visibility
    ctx.strokeText(`Score: ${gameStateRef.current.currentScore}`, 10, 20);
    ctx.fillText(`Score: ${gameStateRef.current.currentScore}`, 10, 20);
    
    ctx.strokeText(`Height: ${Math.floor(Math.max(0, -player.y + GAME_HEIGHT) / 10)}m`, 10, 35);
    ctx.fillText(`Height: ${Math.floor(Math.max(0, -player.y + GAME_HEIGHT) / 10)}m`, 10, 35);
    
    // Show points if any earned
    if (points > 0) {
      ctx.fillStyle = '#B8860B'; // Dark golden color
      ctx.strokeText(`Points: ${points}`, 10, 50);
      ctx.fillStyle = '#B8860B';
      ctx.fillText(`Points: ${points}`, 10, 50);
    }
    
    // Center title during gameplay - smaller and higher up
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.strokeText('NadJump', GAME_WIDTH / 2, 25);
    ctx.fillText('NadJump', GAME_WIDTH / 2, 25);
    
    ctx.restore();
    
    // Show points message when score reaches 20+
    if (score >= 20) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.fillRect(10, GAME_HEIGHT - 120, GAME_WIDTH - 20, 40);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Points will have future utility - don\'t miss!', GAME_WIDTH / 2, GAME_HEIGHT - 95);
    }
    
    // Mobile touch instruction (subtle overlay)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tap left/right sides to move • Tap center to jump', GAME_WIDTH / 2, GAME_HEIGHT - 20);
    ctx.restore();
  };

  // Handle mouse/touch input
  const handleInput = useCallback((event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    if (gameStateRef.current.currentState === 'menu') {
      // Button detection
      if (x >= 20 && x <= 120 && y >= 20 && y <= 55) {
        // Leaderboard button (top left position)
        window.open('https://monad-games-id-site.vercel.app/leaderboard?page=1&gameId=236', '_blank');
      } else if (x >= GAME_WIDTH/2 - 75 && x <= GAME_WIDTH/2 + 75 && y >= 290 && y <= 330) {
        // Play button - always allow playing
        startGame();
      }
    } else if (gameStateRef.current.currentState === 'gameover') {
      // Play Again button
      if (x >= GAME_WIDTH/2 - 120 && x <= GAME_WIDTH/2 + 120 && y >= 350 && y <= 400) {
        startGame();
      }
      // Share Score button
      else if (x >= GAME_WIDTH/2 - 80 && x <= GAME_WIDTH/2 + 80 && y >= 420 && y <= 460) {
        // Use shareGame from Farcaster
        if (gameStateRef.current.finalScore > 0) {
          shareGame(gameStateRef.current.finalScore);
          toast.success(`Sharing score: ${gameStateRef.current.finalScore}!`);
        } else {
          shareGame(); // Share without score
          toast.success('Sharing NadJump!');
        }
      }
      // Main Menu button
      else if (x >= GAME_WIDTH/2 - 60 && x <= GAME_WIDTH/2 + 60 && y >= 480 && y <= 515) {
        gameStateRef.current.currentState = 'menu';
      }
    } else if (gameStateRef.current.currentState === 'playing') {
      // Simple left/right side touch controls
      const leftZone = GAME_WIDTH * 0.3; // Left 30% of screen
      const rightZone = GAME_WIDTH * 0.7; // Right 30% of screen
      
      if (x < leftZone) {
        // Left side tap - move left
        gameStateRef.current.keys.left = true;
        setTimeout(() => gameStateRef.current.keys.left = false, 150);
      } else if (x > rightZone) {
        // Right side tap - move right
        gameStateRef.current.keys.right = true;
        setTimeout(() => gameStateRef.current.keys.right = false, 150);
      } else {
        // Center tap - jump
        if (!gameStateRef.current.keys.wasSpacePressed) {
          gameStateRef.current.keys.space = true;
          setTimeout(() => gameStateRef.current.keys.space = false, 100);
        }
      }
    }
  }, [shareGame]); // eslint-disable-line react-hooks/exhaustive-deps

  // Game mechanics
  const startGame = () => {
    const gameState = gameStateRef.current;
    gameState.currentState = 'playing';
    gameState.platforms = generatePlatforms();
    gameState.particles = [];
    gameState.camera.y = 0;
    gameState.camera.targetY = 0;
    gameState.maxHeight = 0;
    
    gameState.player = {
      x: GAME_WIDTH / 2 - 15,
      y: GAME_HEIGHT - 300, // Much higher starting position, well above water (which is at GAME_HEIGHT - 100)
      vx: 0,
      vy: 0,
      width: 30, // Smaller player
      height: 30,
      onGround: false,
      animTime: 0,
      squash: 1.0
    };
    
    gameState.currentScore = 0;
    setScore(0);
    
    // Reset water level to starting position
    gameState.waterLevel = GAME_HEIGHT - 100;
    gameState.highestPlayerY = GAME_HEIGHT - 300;
    
    // Don't reset points - they accumulate across games
  };

  const updateGame = useCallback(() => {
    const gameState = gameStateRef.current;
    gameState.animTime += 1;

    if (gameState.currentState === 'playing') {
      updateGameLogic();
    }

    // Render based on current state
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gameState.currentState === 'menu') {
      renderMenu(ctx);
    } else if (gameState.currentState === 'playing') {
      renderGame(ctx);
    } else if (gameState.currentState === 'gameover') {
      renderGameOver(ctx);
    }

    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateGameLogic = () => {
    const { player, platforms, particles, keys, camera } = gameStateRef.current;
    
    // Player input
    if (keys.left) player.vx = Math.max(player.vx - 1.2, -PLAYER_SPEED);
    else if (keys.right) player.vx = Math.min(player.vx + 1.2, PLAYER_SPEED);
    else player.vx *= 0.88; // Friction
    
    // Gravity
    player.vy += GRAVITY;
    if (player.vy > 18) player.vy = 18; // Terminal velocity
    
    // Update position
    player.x += player.vx;
    player.y += player.vy;
    
    // Screen wrap
    if (player.x + player.width < 0) player.x = GAME_WIDTH;
    else if (player.x > GAME_WIDTH) player.x = -player.width;
    
    // Generate more platforms as player goes up - ensure at least one platform per row
    const highestPlatformY = Math.min(...platforms.map(p => p.y));
    console.log('Player Y:', player.y, 'Highest Platform Y:', highestPlatformY, 'Platforms count:', platforms.length);
    
    if (player.y < highestPlatformY + 300) {
      let platformsGenerated = 0;
      
      // Generate platforms going upward with better spacing and positioning
      for (let i = 0; i < 10; i++) {
        const newY = highestPlatformY - (45 * (i + 1)); // Reduced to 45px spacing for consistent jumpability
        
        // Try to generate a platform for this row with 65% chance
        if (Math.random() < 0.65) {
          // Find existing platforms at similar height to ensure reachable positioning
          const nearbyPlatforms = platforms.filter(p => Math.abs(p.y - (newY + 45)) < 80);
          let x;
          
          if (nearbyPlatforms.length > 0) {
            // Position within jumping distance of an existing platform
            const nearestPlatform = nearbyPlatforms[Math.floor(Math.random() * nearbyPlatforms.length)];
            const maxJumpDistance = 120; // Reduced horizontal jump distance for easier gameplay
            const minX = Math.max(0, nearestPlatform.x - maxJumpDistance);
            const maxX = Math.min(GAME_WIDTH - 70, nearestPlatform.x + maxJumpDistance);
            x = minX + Math.random() * (maxX - minX);
          } else {
            // Random positioning if no nearby platforms
            x = Math.random() * (GAME_WIDTH - 70);
          }
          
          const type = Math.random() < 0.1 ? 'spring' : 
                       Math.random() < 0.15 ? 'moving' : 
                       Math.random() < 0.05 ? 'breakable' : 'normal';
          
          let color = '#22c55e'; // Green
          if (type === 'moving') color = '#ef4444'; // Red
          else if (type === 'spring') color = '#3b82f6'; // Blue
          else if (type === 'breakable') color = '#f59e0b'; // Orange
          
          platforms.push({
            x,
            y: newY,
            width: 70,
            height: 12,
            type,
            vx: type === 'moving' ? (Math.random() < 0.5 ? -1.5 : 1.5) : 0,
            color,
            broken: false
          });
          platformsGenerated++;
        }
      }
      
      // Force at least 2 platforms in reachable positions
      if (platformsGenerated < 2) {
        for (let i = 0; i < 2 - platformsGenerated; i++) {
          const forceY = highestPlatformY - (60 * (i + 1));
          const x = GAME_WIDTH / 2 - 35 + (Math.random() - 0.5) * 120; // Center-ish with less variation for easier jumps
          
          platforms.push({
            x: Math.max(0, Math.min(GAME_WIDTH - 70, x)),
            y: forceY,
            width: 70,
            height: 12,
            type: 'normal',
            vx: 0,
            color: '#22c55e',
            broken: false
          });
        }
      }
    }
    
    // Simple platform collision - land on top only
    player.onGround = false;
    platforms.forEach(platform => {
      if (platform.broken) return;
      
      // Simple collision - just check if falling onto platform
      if (player.x + player.width > platform.x && 
          player.x < platform.x + platform.width &&
          player.y + player.height >= platform.y && 
          player.y + player.height <= platform.y + 15 &&
          player.vy > 0) {
        
        player.y = platform.y - player.height;
        player.vy = JUMP_STRENGTH * 0.9; // Higher auto-bounce
        player.onGround = true;
        player.squash = 0.7;
        
        // Award score for successful platform landing
        gameStateRef.current.currentScore += 1;
        setScore(gameStateRef.current.currentScore);
        
        // Platform effects with bonus scores
        if (platform.type === 'spring') {
          player.vy = JUMP_STRENGTH * 1.5; // Spring boost
          gameStateRef.current.currentScore += 1; // Bonus point for spring
          setScore(gameStateRef.current.currentScore);
        } else if (platform.type === 'breakable') {
          platform.broken = true;
          gameStateRef.current.currentScore += 2; // Extra points for breakable platforms
          setScore(gameStateRef.current.currentScore);
          setTimeout(() => platform.broken = false, 3000); // Respawn after 3s
        }
        
        createParticles(platform.x + platform.width/2, platform.y, platform.color, 6);
      }
      
      // Moving platforms
      if (platform.type === 'moving' && platform.vx) {
        platform.x += platform.vx;
        if (platform.x <= 0 || platform.x >= GAME_WIDTH - platform.width) {
          platform.vx *= -1;
        }
      }
    });
    
    // Manual jump (space key) with score bonus
    if (keys.space && !keys.wasSpacePressed && player.onGround) {
      player.vy = JUMP_STRENGTH; // Normal jump strength
      player.squash = 1.3; // Stretch effect
      // Bonus point for manual jump skill
      gameStateRef.current.currentScore += 0.5;
      setScore(Math.floor(gameStateRef.current.currentScore));
      createParticles(player.x + player.width/2, player.y + player.height, '#836EF9', 8);
    }
    keys.wasSpacePressed = keys.space;
    
    // Restore squash animation (slower)
    player.squash += (1.0 - player.squash) * 0.15;
    
    // ORIGINAL camera logic - follow player up
    if (player.y < GAME_HEIGHT/2) {
      camera.targetY = -(player.y - GAME_HEIGHT/2);
    }
    camera.y = camera.targetY;
    
    // Update water level based on player's highest position achieved
    if (player.y < gameStateRef.current.highestPlayerY) {
      gameStateRef.current.highestPlayerY = player.y;
      // Water level follows player progress - rises as player goes higher
      // Keep water about 400px below the highest point reached
      gameStateRef.current.waterLevel = player.y + 400;
      console.log('New highest point reached! Player Y:', player.y.toFixed(1), 'Water Level:', gameStateRef.current.waterLevel.toFixed(1));
    }
    
    // Update height tracking and score calculation
    const currentHeight = Math.max(0, (GAME_HEIGHT - 200) - player.y);
    if (currentHeight > gameStateRef.current.maxHeight) {
      gameStateRef.current.maxHeight = currentHeight;
      
      // Score is based on successful platform landings, not just height
      // This makes score different from height - score increases when landing on platforms
      // Height continues independently based on actual position
      const newScore = gameStateRef.current.currentScore; // Keep current score until platform landing
      setScore(newScore);
      console.log('Height updated:', Math.floor(currentHeight / 10), 'Score:', newScore);
      
      // Award points for reaching score of 20+
      if (newScore >= 20 && newScore > gameStateRef.current.lastSubmittedScore) {
        const pointsToAdd = newScore - Math.max(19, gameStateRef.current.lastSubmittedScore);
        setPoints(prev => prev + pointsToAdd);
        gameStateRef.current.lastSubmittedScore = newScore;
      }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // Gravity on particles
      p.life--;
      
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
    
    // Game over check - player touches rising water level
    if (player.y + player.height >= gameStateRef.current.waterLevel) {
      console.log('GAME OVER! Player hit rising water - Player Bottom:', (player.y + player.height).toFixed(1), 'Water Level:', gameStateRef.current.waterLevel.toFixed(1));
      endGame();
    }
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    const particles = gameStateRef.current.particles;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 8 - 2,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 2 + Math.random() * 3
      });
    }
  };

  const endGame = async () => {
    // Prevent multiple calls to endGame
    if (gameStateRef.current.currentState === 'gameover') {
      console.log('EndGame already called, skipping...');
      return;
    }
    
    // Store the final score before changing state
    console.log('End game - Current score:', gameStateRef.current.currentScore, 'Max height:', gameStateRef.current.maxHeight);
    console.log('PlayerAddress prop:', playerAddress);
    console.log('PlayerAddress ref:', playerAddressRef.current);
    console.log('Score:', score);
    
    // Use the game's actual score, not the React state
    const finalScore = gameStateRef.current.currentScore;
    const currentPlayerAddress = playerAddressRef.current;
    gameStateRef.current.finalScore = finalScore;
    gameStateRef.current.currentState = 'gameover';
    
    // Submit score to secure API endpoint
    if (finalScore > 0 && currentPlayerAddress) {
      console.log('Attempting to submit score...');
      try {
        const result = await submitPlayerScore(currentPlayerAddress, Math.floor(finalScore), 1);
        console.log('Score submission result:', result);
        
        if (result.success) {
          toast.success('Score submitted successfully!');
          console.log('Score submitted:', result);
          
          if (result.transactionHash) {
            toast.success(`TX: ${result.transactionHash.slice(0, 10)}...`, {
              duration: 5000,
              icon: '📝',
            });
          }
        } else {
          console.error('Score submission failed:', result.error);
          toast.error(`Failed to submit score: ${result.error}`);
        }
      } catch (error) {
        console.error('Error submitting score:', error);
        toast.error('Failed to submit score');
      }
      
      sendNotification(`New score: ${finalScore}!`);
    } else {
      console.log('Score submission skipped - FinalScore:', finalScore, 'PlayerAddress:', currentPlayerAddress);
      if (!currentPlayerAddress) {
        toast.error('Please sign in to submit scores');
      }
    }
  };

  // Render game over screen
  const renderGameOver = (ctx: CanvasRenderingContext2D) => {
    // Sky gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Game Over overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Game Over text
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('Game Over!', GAME_WIDTH / 2, 200);

    // Final Score
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Final Score: ${gameStateRef.current.finalScore}`, GAME_WIDTH / 2, 260);

    // Height achieved
    const heightMeters = Math.floor(gameStateRef.current.maxHeight / 100);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(`Height Reached: ${heightMeters}m`, GAME_WIDTH / 2, 300);

    // Play Again button
    const playAgainBtn = { x: GAME_WIDTH/2 - 120, y: 350, width: 240, height: 50 };
    drawGradientRect(ctx, playAgainBtn.x, playAgainBtn.y, playAgainBtn.width, playAgainBtn.height,
                     '#836EF9', '#6B46C1', 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Play Again', playAgainBtn.x + playAgainBtn.width/2, playAgainBtn.y + 32);

    // Share Score button (if Farcaster is available)
    const shareBtn = { x: GAME_WIDTH/2 - 80, y: 420, width: 160, height: 40 };
    drawGradientRect(ctx, shareBtn.x, shareBtn.y, shareBtn.width, shareBtn.height,
                     '#10b981', '#059669', 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Share Score', shareBtn.x + shareBtn.width/2, shareBtn.y + 26);

    // Back to Menu button
    const menuBtn = { x: GAME_WIDTH/2 - 60, y: 480, width: 120, height: 35 };
    drawGradientRect(ctx, menuBtn.x, menuBtn.y, menuBtn.width, menuBtn.height,
                     '#6b7280', '#4b5563', 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.fillText('Main Menu', menuBtn.x + menuBtn.width/2, menuBtn.y + 22);

    ctx.restore();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = gameStateRef.current.keys;
      switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          keys.left = true;
          break;
        case 'd':
        case 'arrowright':
          keys.right = true;
          break;
        case ' ':
          keys.space = true;
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = gameStateRef.current.keys;
      switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          keys.left = false;
          break;
        case 'd':
        case 'arrowright':
          keys.right = false;
          break;
        case ' ':
          keys.space = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas to full screen
    const resizeCanvas = () => {
      GAME_WIDTH = window.innerWidth;
      GAME_HEIGHT = window.innerHeight;
      canvas.width = GAME_WIDTH;
      canvas.height = GAME_HEIGHT;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleClick = (e: MouseEvent) => handleInput(e);
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      handleInput(e);
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch);

    // Start game loop
    gameLoopRef.current = requestAnimationFrame(updateGame);

    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [handleInput, updateGame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        imageRendering: 'pixelated',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1
      }}
    />
  );
}