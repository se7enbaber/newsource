import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Feedback Proxy Route
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const tenantId = request.headers.get('x-tenant-id');

        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        
        let effectiveTenantId = tenantId;
        if (!effectiveTenantId) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                effectiveTenantId = payload.tenant_id || payload.TenantId;
            } catch (e) {}
        }

        const aiServiceUrl = process.env.AI_FEEDBACK_URL || 'http://ai-service:8000/feedback';

        const response = await fetch(aiServiceUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, tenant_id: effectiveTenantId }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
