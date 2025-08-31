import { NextRequest, NextResponse } from 'next/server';
import { generateSessionToken, validateOrigin, createAuthenticatedResponse } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createAuthenticatedResponse(
        { error: 'Forbidden: Invalid origin' },
        403,
        request.headers.get('origin')
      );
    }

    const { playerAddress, signedMessage, message } = await request.json();

    if (!playerAddress || !signedMessage || !message) {
      return createAuthenticatedResponse(
        { error: 'Missing required fields: playerAddress, signedMessage, message' },
        400,
        request.headers.get('origin')
      );
    }

    // Verify that the message contains the player address and a recent timestamp
    // This should be done by checking the signature against the player's wallet
    // For now, we'll implement a basic check - in production, you'd verify the signature
    if (!message.includes(playerAddress)) {
      return createAuthenticatedResponse(
        { error: 'Invalid message format' },
        400,
        request.headers.get('origin')
      );
    }

    // TODO: Add proper signature verification here using viem/ethers
    // For now, we'll trust that the frontend provides the correct signature
    
    // Generate session token
    const timestamp = Math.floor(Date.now() / 30000) * 30000; // Round to 30-second intervals
    const sessionToken = generateSessionToken(playerAddress, timestamp);

    return createAuthenticatedResponse({
      success: true,
      sessionToken,
      expiresAt: timestamp + 300000, // 5 minutes from token timestamp
    }, 200, request.headers.get('origin'));

  } catch (error) {
    console.error('Error generating session token:', error);
    return createAuthenticatedResponse(
      { error: 'Failed to generate session token' },
      500,
      request.headers.get('origin')
    );
  }
}
