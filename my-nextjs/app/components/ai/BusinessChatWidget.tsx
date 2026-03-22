'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Sparkles, 
    MessageSquare, 
    RotateCcw, 
    BookText, 
    Info,
    ChevronDown,
    BrainCircuit,
    Database
} from 'lucide-react';
import { Button, Tooltip, Typography, Space, Divider, message as antdMessage } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAiChat } from '@/lib/AiProvider';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useTheme } from '@/lib/ThemeProvider';
import { getAllUserInfo } from '@/lib/auth-utils';

const { Text, Title } = Typography;

export const BusinessChatWidget: React.FC = () => {
    const { t } = useTranslation();
    const { messages, isLoading, sendMessage, clearHistory, triggerIngest } = useAiChat();
    const { primaryColor, isDarkMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const userInfo = getAllUserInfo();
    const isAdmin = userInfo?.permissions.includes('*') || userInfo?.tenantCode?.toLowerCase() === 'host';

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleIngest = async () => {
        try {
            await triggerIngest();
            antdMessage.success(t('ai_ingest_success', 'Đã nạp lại bộ tri thức thành công!'));
        } catch (error: any) {
            antdMessage.error(t('ai_ingest_error', 'Lỗi khi nạp lại tri thức: ' + error.message));
        }
    };

    const suggestions = [
        t('ai_suggest_1', 'Quy trình bán hàng gồm những bước nào?'),
        t('ai_suggest_2', 'Làm sao để tạo một Tenant mới?'),
        t('ai_suggest_3', 'Chính sách bảo mật hệ thống là gì?'),
        t('ai_suggest_4', 'Hướng dẫn quản lý kho (Inventory)?'),
    ];

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className="fixed right-6 bottom-24 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="pointer-events-auto w-[380px] sm:w-[420px] h-[580px] max-h-[80vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col"
                    >
                        {/* Header */}
                        <div 
                            className="p-4 flex items-center justify-between text-white"
                            style={{ 
                                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <BrainCircuit size={20} />
                                </div>
                                <div>
                                    <Title level={5} className="m-0 text-white text-sm" style={{ color: 'white' }}>
                                        {t('ai_assistant_title', 'Business AI Assistant')}
                                    </Title>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        <Text className="text-[10px] text-white/80" style={{ color: 'rgba(255,255,255,0.8)' }}>Online • Knowledge Guard Active</Text>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {isAdmin && (
                                    <Tooltip title={t('ai_re_ingest', 'Nạp lại tri thức (Admin only)')}>
                                        <Button 
                                            type="text" 
                                            icon={<Database size={16} className="text-white" />} 
                                            onClick={handleIngest}
                                            loading={isLoading}
                                            className="hover:bg-white/10"
                                        />
                                    </Tooltip>
                                )}
                                <Tooltip title={t('clear_history', 'Xóa lịch sử')}>
                                    <Button 
                                        type="text" 
                                        icon={<RotateCcw size={16} className="text-white" />} 
                                        onClick={clearHistory}
                                        className="hover:bg-white/10"
                                    />
                                </Tooltip>
                                <Button 
                                    type="text" 
                                    icon={<X size={20} className="text-white" />} 
                                    onClick={toggleOpen}
                                    className="hover:bg-white/10"
                                />
                            </div>
                        </div>

                        {/* Message Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-zinc-50/50"
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                                    <div className="p-4 bg-indigo-50 text-indigo-500 rounded-full animate-bounce">
                                        <Sparkles size={32} />
                                    </div>
                                    <div>
                                        <Title level={4} className="mb-2 text-zinc-800">
                                            {t('ai_welcome_title', 'Xin chào! Tôi có thể giúp gì cho bạn?')}
                                        </Title>
                                        <Text type="secondary" className="text-sm">
                                            Tôi là chuyên gia về quy trình nghiệp vụ ERP. Hãy đặt câu hỏi để bắt đầu nhiệm vụ cứu thế giới nghiệp vụ của bạn!
                                        </Text>
                                    </div>
                                    
                                    <div className="w-full space-y-2 pt-4">
                                        <Text strong className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-2">
                                            Gợi ý cho bạn:
                                        </Text>
                                        <div className="flex flex-col gap-2">
                                            {suggestions.map((text, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => sendMessage(text)}
                                                    className="text-left p-3 text-xs bg-white border border-zinc-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-zinc-600 shadow-sm"
                                                >
                                                    {text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, i) => (
                                        <ChatMessage 
                                            key={i} 
                                            message={msg} 
                                            isLast={i === messages.length - 1} 
                                        />
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <BrainCircuit size={18} className="animate-spin" />
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-zinc-100 shadow-sm">
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer / Input */}
                        <ChatInput onSend={sendMessage} isLoading={isLoading} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.div
                className="pointer-events-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <button
                    onClick={toggleOpen}
                    className="group relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg transition-all focus:outline-none"
                    style={{ 
                        background: isOpen ? '#f43f5e' : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
                        boxShadow: `0 8px 32px ${isOpen ? 'rgba(244,63,94,0.3)' : 'rgba(43,212,189,0.3)'}`
                    }}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 90 }}
                            >
                                <X size={24} className="text-white" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="relative"
                            >
                                <BrainCircuit size={24} className="text-white" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </motion.div>
        </div>
    );
};
