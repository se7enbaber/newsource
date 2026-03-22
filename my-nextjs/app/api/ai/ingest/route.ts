import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Re-Ingestion Proxy Route
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Decode token to check role (only Admin should be able to trigger ingestion)
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
        const roleList = Array.isArray(roles) ? roles : [roles];
        
        const isAdmin = roleList.some(r => r?.toLowerCase() === 'admin');
        const tenantCode = payload.tenant_code || '';

        if (!isAdmin && tenantCode.toLowerCase() !== 'host') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const effectiveTenantId = payload.tenant_id || payload.TenantId || 'system';

        const aiServiceUrl = `${process.env.AI_SERVICE_BASE_URL || 'http://ai-service:8000'}/ingest?tenant_id=${effectiveTenantId}`;

        const response = await fetch(aiServiceUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
