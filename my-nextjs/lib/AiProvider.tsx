'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getTenantId } from './auth-utils';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    sources?: string[];
}

interface AiContextType {
    messages: ChatMessage[];
    isLoading: boolean;
    sendMessage: (content: string) => Promise<void>;
    sendFeedback: (rating: number, comment?: string) => Promise<void>;
    triggerIngest: () => Promise<void>;
    clearHistory: () => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const useAiChat = () => {
    const context = useContext(AiContext);
    if (!context) {
        throw new Error('useAiChat must be used within an AiProvider');
    }
    return context;
};

export const AiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: content.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const token = localStorage.getItem('access_token');
            const tenantId = getTenantId();

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({
                    message: content,
                    chat_history: messages.map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'assistant',
                        content: msg.content
                    }))
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to get response from AI assistant');
            }

            const data = await response.json();

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.answer,
                timestamp: Date.now(),
                sources: data.sources
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (error: any) {
            console.error('[AiProvider] Error sending message:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: `❌ Lỗi: ${error.message || 'Không thể kết nối với trí tuệ nhân tạo. Vui lòng thử lại sau.'}`,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    const sendFeedback = useCallback(async (rating: number, comment?: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const tenantId = getTenantId();

            await fetch('/api/ai/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({ rating, comment })
            });
        } catch (error) {
            console.error('[AiProvider] Error sending feedback:', error);
        }
    }, []);

    const triggerIngest = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/ai/ingest', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to trigger ingestion');
            }
        } catch (error: any) {
            console.error('[AiProvider] Error triggering ingest:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearHistory = useCallback(() => {
        setMessages([]);
    }, []);

    return (
        <AiContext.Provider value={{ 
            messages, 
            isLoading, 
            sendMessage, 
            sendFeedback, 
            triggerIngest, 
            clearHistory 
        }}>
            {children}
        </AiContext.Provider>
    );
};
