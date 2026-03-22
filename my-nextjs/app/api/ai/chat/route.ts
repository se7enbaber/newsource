import { NextRequest, NextResponse } from 'next/server';

/**
 * AI API Proxy Route
 * Phục vụ cho Business AI Notebook.
 * Chuyển tiếp request từ Frontend sang AiService (Python/FastAPI) trong mạng Docker.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Trích xuất Authorization và Tenant ID từ Request headers
        const authHeader = request.headers.get('authorization');
        const tenantId = request.headers.get('x-tenant-id');

        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Chế biến body gửi sang AiService
        const body = await request.json();
        
        // Luôn ghi đè tenant_id từ Header để đảm bảo tính an toàn (không để khách hàng tự gửi tenant_id trong body)
        // Nếu không có x-tenant-id trong header, chúng ta có thể decode từ JWT (nếu cần)
        let effectiveTenantId = tenantId;
        
        if (!effectiveTenantId) {
            // Thử decode từ JWT Token
            try {
                const token = authHeader.replace('Bearer ', '');
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                effectiveTenantId = payload.tenant_id || payload.TenantId;
            } catch (e) {
                console.error('[AI Proxy] Failed to decode tenant_id from token:', e);
            }
        }

        if (!effectiveTenantId) {
            return NextResponse.json({ error: 'Tenant ID is required but missing' }, { status: 400 });
        }

        // Chuẩn bị payload cho AiService (FastAPI)
        const aiServicePayload = {
            message: body.message,
            tenant_id: effectiveTenantId,
            chat_history: body.chat_history || []
        };

        // 3. Gọi sang AiService
        // Sử dụng AI_SERVICE_BASE_URL để linh hoạt giữa môi trường local và docker
        const aiServiceBaseUrl = process.env.AI_SERVICE_BASE_URL || 'http://ai-service:8000';
        const aiServiceUrl = `${aiServiceBaseUrl}/chat`;
        
        console.log(`[AI Proxy] Forwarding message from Tenant ${effectiveTenantId} to ${aiServiceUrl}`);

        const response = await fetch(aiServiceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(aiServicePayload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[AI Proxy] AiService returned error:', response.status, errorData);
            return NextResponse.json(
                { error: 'AI Service Error', details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[AI Proxy] Exception:', error);
        return NextResponse.json(
            { error: 'Proxy Exception', message: error.message },
            { status: 500 }
        );
    }
}
