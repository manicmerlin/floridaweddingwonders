import { NextRequest, NextResponse } from 'next/server';
import { submitUrlToIndexNow, submitMultipleUrls } from '@/lib/indexnow';

/**
 * IndexNow API Route
 * 
 * Endpoint for submitting URLs to search engines via IndexNow
 * POST /api/indexnow
 * 
 * Body:
 * - url: string (single URL to submit)
 * - urls: string[] (multiple URLs to submit)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.url && !body.urls) {
      return NextResponse.json(
        { error: 'Either url or urls must be provided' },
        { status: 400 }
      );
    }

    // Single URL submission
    if (body.url) {
      const result = await submitUrlToIndexNow(body.url);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'URL submitted successfully',
          url: body.url,
        });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: result.error || 'Submission failed' 
          },
          { status: 500 }
        );
      }
    }

    // Multiple URLs submission
    if (body.urls && Array.isArray(body.urls)) {
      const result = await submitMultipleUrls(body.urls);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'URLs submitted successfully',
          count: result.submittedCount || body.urls.length,
        });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: result.error || 'Submission failed' 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );

  } catch (error) {
    console.error('IndexNow API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for verification and health check
 */
export async function GET() {
  const apiKey = process.env.INDEXNOW_API_KEY;
  
  return NextResponse.json({
    configured: !!apiKey,
    endpoint: '/api/indexnow',
    usage: {
      POST: {
        description: 'Submit URLs to IndexNow',
        body: {
          url: 'string (single URL)',
          urls: 'string[] (multiple URLs)',
        },
      },
    },
  });
}
