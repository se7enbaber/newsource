import { NextRequest, NextResponse } from 'next/server';

async function handler(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const pathSegments = params.path;
    const path = pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    
    // Header forwarding logic
    const headers = new Headers();
    request.headers.forEach((value, key) => {
        // Forward essential headers
        if (['authorization', 'content-type', 'x-tenant-id'].includes(key.toLowerCase())) {
            headers.set(key, value);
        }
    });

    const backendBaseUrl = (process.env.BACKEND_URL || 'http://localhost:5002').replace(/\/$/, '');
    const targetUrl = `${backendBaseUrl}/${path}${searchParams ? '?' + searchParams : ''}`;

    try {
        const fetchOptions: RequestInit = {
            method: request.method,
            headers,
        };

        // Forward body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            const body = await request.arrayBuffer();
            if (body && body.byteLength > 0) {
                fetchOptions.body = body;
            }
        }

        const response = await fetch(targetUrl, fetchOptions);

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            return NextResponse.json(
                data || { error: 'Backend Error', status: response.status },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data);
        } else {
            // Stream binary data (images, etc)
            const blob = await response.blob();
            return new NextResponse(blob, {
                status: response.status,
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': response.headers.get('content-length') || '',
                }
            });
        }
    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Proxy failed', message: error.message }, { status: 500 });
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
