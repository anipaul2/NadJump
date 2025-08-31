import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload from Farcaster
    const payload = await request.json();
    
    // Log the webhook event (you can process this data as needed)
    console.log('Farcaster webhook received:', JSON.stringify(payload, null, 2));
    
    // You can add custom logic here to handle different webhook events
    // For example: user interactions, cast creations, etc.
    
    return Response.json({ 
      success: true, 
      message: 'Webhook received successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to process webhook' 
    }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function GET() {
  return Response.json({ 
    success: true, 
    message: 'NadJump webhook endpoint is active' 
  }, { status: 200 });
}