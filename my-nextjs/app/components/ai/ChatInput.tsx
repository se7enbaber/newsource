'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash } from 'lucide-react';
import { Button, Input } from 'antd';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const textAreaRef = useRef<any>(null);

    const handleSend = () => {
        if (text.trim() && !isLoading) {
            onSend(text.trim());
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-3 bg-white border-t border-zinc-100">
            <div className="relative flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-1.5 focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-100 transition-all">
                <TextArea
                    ref={textAreaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('ai_chat_placeholder', 'Hỏi tôi về quy trình nghiệp vụ...')}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    disabled={isLoading}
                    variant="borderless"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-1.5 px-2"
                />
                
                <Button
                    type="primary"
                    shape="circle"
                    icon={<Send size={16} />}
                    disabled={!text.trim() || isLoading}
                    onClick={handleSend}
                    className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 h-9 w-9 flex items-center justify-center border-none"
                    loading={isLoading}
                />
            </div>
            <div className="mt-2 flex justify-between items-center px-1">
                <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Hash size={10} />
                    <span>Business Knowledge Only</span>
                </div>
                <div className="text-[10px] text-zinc-400">
                    Shift + Enter to add a line
                </div>
            </div>
        </div>
    );
};
