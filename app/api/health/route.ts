import { NextResponse } from 'next/server';
import { isConnected } from '@/lib/db';

/**
 * Health Check API Route
 *
 * GET /api/health - Returns health status with DB connection check
 * HEAD /api/health - Lightweight check for load balancers
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const dbConnected = await isConnected();

    const healthStatus = {
      status: dbConnected ? 'healthy' : 'unhealthy',
      timestamp,
      services: {
        database: {
          connected: dbConnected,
        },
      },
    };

    return NextResponse.json(healthStatus, {
      status: dbConnected ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Health Check] Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp,
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD request for lightweight health checks (load balancers, Docker)
 */
export async function HEAD() {
  const isHealthy = await isConnected();

  return new NextResponse(null, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
