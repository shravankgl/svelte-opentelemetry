import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'svelte-otel-app',
            version: '1.0.0',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            checks: {
                opentelemetry: 'enabled',
                server: 'running'
            }
        };

        return new Response(JSON.stringify(healthStatus, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        const errorStatus = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'svelte-otel-app',
            error: error instanceof Error ? error.message : 'Unknown error'
        };

        return new Response(JSON.stringify(errorStatus, null, 2), {
            status: 503,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};