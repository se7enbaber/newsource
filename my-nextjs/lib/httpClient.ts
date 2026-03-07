export const request = async (url: string, options: any = {}) => {
    const token = localStorage.getItem('access_token');

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, { ...options, headers });

    // Nếu mã lỗi là 401 -> Token hết hạn hoặc không hợp lệ
    if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/login'; // Chuyển hướng cứng để xóa sạch state cũ
        return;
    }

    return response;
};