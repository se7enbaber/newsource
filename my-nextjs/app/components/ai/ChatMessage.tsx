'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '@/lib/AiProvider';
import { User, Bot, FileText, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tag, Space, Typography, Button, Tooltip } from 'antd';
import { useAiChat } from '@/lib/AiProvider';

const { Text } = Typography;

interface ChatMessageProps {
    message: ChatMessageType;
    isLast: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast }) => {
    const isAssistant = message.role === 'assistant';
    const { sendFeedback } = useAiChat();
    const [voted, setVoted] = React.useState<number | null>(null);

    const handleVote = (rating: number) => {
        if (voted !== null) return;
        setVoted(rating);
        sendFeedback(rating);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}
        >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isAssistant ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white'
            }`}>
                {isAssistant ? <Bot size={18} /> : <User size={18} />}
            </div>

            {/* Content */}
            <div className={`flex flex-col max-w-[85%] ${isAssistant ? '' : 'items-end'}`}>
                <div className={`p-3 rounded-2xl ${
                    isAssistant 
                        ? 'bg-white shadow-sm border border-zinc-100 rounded-tl-sm' 
                        : 'bg-zinc-100 text-zinc-800 rounded-tr-sm'
                }`}>
                    {isAssistant ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                </div>

                {/* Sources & Metadata */}
                <div className="mt-1 flex items-center justify-between w-full">
                    <div className="flex flex-wrap gap-2">
                        {isAssistant && message.sources && message.sources.length > 0 && (
                            <Space size={4} wrap className="mt-1">
                                <FileText size={12} className="text-zinc-400" />
                                <Text type="secondary" style={{ fontSize: '11px' }}>Nguồn:</Text>
                                {Array.from(new Set(message.sources)).map((source, i) => (
                                    <Tag key={i} color="default" className="m-0 text-[10px] px-1 bg-zinc-50 border-zinc-200">
                                        {source}
                                    </Tag>
                                ))}
                            </Space>
                        )}
                    </div>

                    {/* Feedback Buttons */}
                    {isAssistant && (
                        <div className="flex gap-1 ml-auto">
                            <Tooltip title="Câu trả lời hữu ích">
                                <Button 
                                    type="text" 
                                    size="small" 
                                    className={`flex items-center justify-center h-6 w-6 p-0 ${voted === 1 ? 'text-indigo-600' : 'text-zinc-400'}`}
                                    onClick={() => handleVote(1)}
                                    disabled={voted !== null}
                                >
                                    <ThumbsUp size={14} />
                                </Button>
                            </Tooltip>
                            <Tooltip title="Câu trả lời chưa tốt">
                                <Button 
                                    type="text" 
                                    size="small" 
                                    className={`flex items-center justify-center h-6 w-6 p-0 ${voted === -1 ? 'text-red-500' : 'text-zinc-400'}`}
                                    onClick={() => handleVote(-1)}
                                    disabled={voted !== null}
                                >
                                    <ThumbsDown size={14} />
                                </Button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
