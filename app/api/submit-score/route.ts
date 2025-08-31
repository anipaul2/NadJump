import { NextRequest } from 'next/server';
import { createWalletClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESS, CONTRACT_ABI, isValidAddress } from '@/app/lib/blockchain';
import { validateOrigin, createAuthenticatedResponse } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createAuthenticatedResponse(
        { error: 'Forbidden: Invalid origin' },
        403,
        request.headers.get('origin') || undefined || undefined
      );
    }

    // Parse request body
    const { playerAddress, score, transactions = 1 } = await request.json();

    // Validate input
    if (!playerAddress || score === undefined) {
      return createAuthenticatedResponse(
        { error: 'Missing required fields: playerAddress, score' },
        400,
        request.headers.get('origin') || undefined
      );
    }

    // Validate player address format
    if (!isValidAddress(playerAddress)) {
      return createAuthenticatedResponse(
        { error: 'Invalid player address format' },
        400,
        request.headers.get('origin') || undefined
      );
    }

    // Validate that score and transactions are positive numbers
    if (score < 0 || transactions < 0) {
      return createAuthenticatedResponse(
        { error: 'Score and transaction amounts must be non-negative' },
        400,
        request.headers.get('origin') || undefined
      );
    }

    // Basic score validation to prevent abuse
    const MAX_SCORE_PER_REQUEST = 1000;
    const MAX_TRANSACTIONS_PER_REQUEST = 10;
    
    if (score > MAX_SCORE_PER_REQUEST || transactions > MAX_TRANSACTIONS_PER_REQUEST) {
      return createAuthenticatedResponse(
        { error: `Amounts too large. Max score: ${MAX_SCORE_PER_REQUEST}, Max transactions: ${MAX_TRANSACTIONS_PER_REQUEST}` },
        400,
        request.headers.get('origin') || undefined
      );
    }

    // Get private key from environment variable
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      console.error('WALLET_PRIVATE_KEY environment variable not set');
      return createAuthenticatedResponse(
        { error: 'Server configuration error' },
        500,
        request.headers.get('origin') || undefined
      );
    }

    // Create account from private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    // Create wallet client
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http()
    });

    console.log(`Submitting score for player ${playerAddress}: ${score} points, ${transactions} transactions`);

    // Call the updatePlayerData function
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'updatePlayerData',
      args: [
        playerAddress as `0x${string}`,
        BigInt(score),
        BigInt(transactions)
      ]
    });

    console.log(`Score submitted successfully. Transaction hash: ${hash}`);

    return createAuthenticatedResponse({
      success: true,
      transactionHash: hash,
      message: 'Score submitted successfully',
      playerAddress,
      scoreSubmitted: score,
      transactionsSubmitted: transactions
    }, 200, request.headers.get('origin') || undefined);

  } catch (error) {
    console.error('Error submitting score:', error);
    
    // Handle specific viem errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return createAuthenticatedResponse(
          { error: 'Insufficient funds to complete transaction' },
          400,
          request.headers.get('origin') || undefined
        );
      }
      if (error.message.includes('execution reverted')) {
        return createAuthenticatedResponse(
          { error: 'Contract execution failed - check if wallet has GAME_ROLE permission' },
          400,
          request.headers.get('origin') || undefined
        );
      }
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        return createAuthenticatedResponse(
          { error: 'Unauthorized: Wallet does not have GAME_ROLE permission' },
          403,
          request.headers.get('origin') || undefined
        );
      }
    }

    return createAuthenticatedResponse(
      { error: 'Failed to submit score' },
      500,
      request.headers.get('origin') || undefined
    );
  }
}