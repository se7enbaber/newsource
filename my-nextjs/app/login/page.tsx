'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Card, App, Tooltip } from 'antd';
import { 
    UserOutlined, 
    LockOutlined, 
    BankOutlined, 
    ArrowRightOutlined, 
    InfoCircleOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { loginApi } from '@/services/authService';
import { usePermission } from '@/lib/PermissionProvider';

// Thêm các class animation vào CSS module hoặc inline (ở đây dùng Tailwind animation mở rộng)
const animationClasses = "animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out fill-mode-forwards";

export default function LoginPage() {
    const [form] = Form.useForm();
    const { refreshAccess } = usePermission();
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currentYear] = useState(new Date().getFullYear());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const data = await loginApi(values);
            localStorage.setItem('access_token', data.access_token);
            refreshAccess();
            router.replace('/'); // Chuyển về Dashboard
        } catch (error: any) {
            const errorMsg = error.message || 'Sai thông tin đăng nhập. Vui lòng kiểm tra lại.';
            
            // Hiển thị lỗi inline dưới các trường (ví dụ nếu sai thông tin tài khoản)
            form.setFields([
                { name: 'username', errors: [' '] },
                { name: 'password', errors: [errorMsg] },
            ]);
            
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="flex min-h-screen bg-white font-sans selection:bg-teal-100 selection:text-teal-900">
            {/* Left Side: Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-teal-950">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/login-branding.png" // Đây là file ảnh đã generate
                        alt="Branding" 
                        className="w-full h-full object-cover opacity-60 scale-105 animate-pulse-slow"
                        style={{ animationDuration: '8s' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-transparent to-transparent opacity-80" />
                </div>
                
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="mb-8 inline-flex items-center space-x-2 bg-teal-800/30 backdrop-blur-md px-4 py-2 rounded-full border border-teal-500/30 w-fit">
                        <SafetyCertificateOutlined className="text-teal-400" />
                        <span className="text-sm font-medium text-teal-100 uppercase tracking-wider">Enterprise Security</span>
                    </div>
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Quản trị doanh nghiệp <br />
                        <span className="text-teal-400">thông minh & hiệu quả.</span>
                    </h1>
                    <p className="text-xl text-teal-100/70 max-w-lg leading-relaxed">
                        Giải pháp SaaS tích hợp đa nền tảng, giúp tối ưu hóa quy trình làm việc và tăng trưởng doanh thu bền vững.
                    </p>
                    
                    <div className="mt-20 flex items-center space-x-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder logos of trusted partners or certifications */}
                        <div className="text-sm font-bold tracking-widest uppercase">TRUSTED BY INDUSTRY LEADERS</div>
                    </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute bottom-12 left-16 z-10">
                    <div className="flex space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 w-8 rounded-full ${i === 1 ? 'bg-teal-400' : 'bg-teal-800'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 bg-slate-50/50 relative">
                {/* Mobile branding decoration */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-1 bg-teal-500" />
                
                <div className={`w-full max-w-[440px] ${animationClasses}`}>
                    <div className="text-center mb-10">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-xl shadow-teal-200 mb-6 mx-auto">
                            <BankOutlined className="text-3xl text-white" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hệ thống SaaS Admin</h2>
                        <p className="text-slate-500 mt-2">Đăng nhập để quản trị tổ chức của bạn</p>
                    </div>

                    <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-100">
                        <Form 
                            form={form}
                            layout="vertical" 
                            onFinish={onFinish} 
                            requiredMark={false}
                            className="space-y-4"
                            size="large"
                        >
                            <Form.Item 
                                name="tenant" 
                                label={
                                    <div className="flex items-center space-x-1.5">
                                        <span className="font-medium text-slate-700">Mã tổ chức / Tên công ty</span>
                                        <Tooltip title="Mã định danh tổ chức của bạn, do quản trị viên cung cấp">
                                            <InfoCircleOutlined className="text-slate-400 text-xs cursor-help" />
                                        </Tooltip>
                                    </div>
                                }
                                rules={[{ required: true, message: 'Vui lòng nhập mã tổ chức' }]}
                            >
                                <Input 
                                    prefix={<BankOutlined className="text-slate-400 mr-2" />} 
                                    placeholder="ví dụ: CONG_TY_ABC" 
                                    className="rounded-xl border-slate-200 hover:border-teal-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all h-12"
                                    autoComplete="off"
                                />
                            </Form.Item>

                            <Form.Item 
                                name="username" 
                                label={<span className="font-medium text-slate-700">Tài khoản</span>}
                                rules={[{ required: true, message: 'Vui lòng nhập tên tài khoản' }]}
                            >
                                <Input 
                                    prefix={<UserOutlined className="text-slate-400 mr-2" />} 
                                    placeholder="Tên đăng nhập" 
                                    className="rounded-xl border-slate-200 hover:border-teal-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all h-12"
                                />
                            </Form.Item>

                            <Form.Item 
                                name="password" 
                                label={<span className="font-medium text-slate-700">Mật khẩu</span>}
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                            >
                                <Input.Password 
                                    prefix={<LockOutlined className="text-slate-400 mr-2" />} 
                                    placeholder="••••••••" 
                                    className="rounded-xl border-slate-200 hover:border-teal-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all h-12"
                                />
                            </Form.Item>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full h-14 mt-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center space-x-2 
                                    ${loading ? 'bg-teal-400 cursor-not-allowed opacity-80' : 'bg-teal-600 hover:bg-teal-700 active:scale-[0.98] shadow-lg shadow-teal-200 hover:shadow-teal-300'}`}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Đang đăng nhập...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>TIẾP TỤC ĐĂNG NHẬP</span>
                                        <ArrowRightOutlined className="text-lg group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </Form>
                        
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs">
                                <SafetyCertificateOutlined />
                                <span>Hệ thống bảo mật — Phiên làm việc được mã hóa</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center text-slate-400 text-sm">
                        <p>© {currentYear} SaaS Enterprise. Bản quyền thuộc về Công ty.</p>
                        <div className="mt-2 flex justify-center space-x-4">
                            <a href="#" className="hover:text-teal-600 transition-colors">Điều khoản</a>
                            <span>•</span>
                            <a href="#" className="hover:text-teal-600 transition-colors">Bảo mật</a>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1.05); }
                    50% { transform: scale(1.1); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s infinite ease-in-out;
                }
                .animate-in {
                    animation-name: enter;
                }
                @keyframes enter {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}