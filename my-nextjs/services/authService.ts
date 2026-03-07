/**
 * Gọi khi API trả về 401 Unauthorized.
 * XÓA token TRƯỚC rồi mới redirect — tránh vòng lặp với AuthWrapper.
 * (AuthWrapper: có token + ở /login → redirect /products → 401 lại → loop)
 */
export const handleUnauthorized = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
};

/**
 * Đăng xuất — gọi POST /connect/logout.
 * Dù API thành công hay thất bại: vẫn xóa token và về login.
 */
export const logoutApi = async (): Promise<void> => {
    const token = localStorage.getItem('access_token');
    const baseUrl = process.env.NEXT_PUBLIC_API_ADMIN_URL;

    try {
        await fetch(`${baseUrl}/connect/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
    } finally {
        // Luôn xóa token và về login — kể cả khi API lỗi
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    }
};

export const loginApi = async (values: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_ADMIN_URL;
    const url = `${baseUrl}/connect/token`;

    // Tạo body theo định dạng x-www-form-urlencoded từ curl của bạn
    const body = new URLSearchParams();
    body.append('grant_type', 'password');
    body.append('username', values.username);
    body.append('password', values.password);
    body.append('tenant', values.tenant);
    body.append('client_id', 'swagger');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
    });

    if (!response.ok) {
        let errorMsg = 'Đăng nhập thất bại';
        try {
            const errData = await response.clone().json();
            // OpenIddict thường trả về { error, error_description }
            errorMsg = errData.error_description || errData.message || errorMsg;
        } catch (e) {
            try {
                // Nếu không phải JSON, thử parse text thuần (như BadRequest string)
                let textResponse = await response.clone().text();
                if (textResponse && typeof textResponse === 'string') {
                    // Cắt bỏ dấu ngoặc kép bọc ngoài chuỗi lỗi của ASP.NET Core
                    if (textResponse.startsWith('"') && textResponse.endsWith('"')) {
                        textResponse = textResponse.slice(1, -1);
                    }
                    errorMsg = textResponse;
                }
            } catch (err) { }
        }
        throw new Error(errorMsg);
    }

    return response.json(); // Trả về token (access_token)
};