'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Breadcrumb, Space, Tag, Empty, Progress, Statistic, Row, Col, Alert, App, List, Button } from 'antd';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Legend
} from 'recharts';
import { 
    SafetyOutlined, ThunderboltOutlined, WarningOutlined, DollarOutlined, 
    BarChartOutlined, HistoryOutlined, SettingOutlined, SyncOutlined
} from '@ant-design/icons';
import { AppStatCard } from '@/app/components/common/AppStatCard';
import { useTranslation } from 'react-i18next';
import { AccessGuard } from '@/lib/AccessGuard';
import aiGovernanceService, { AiQuotaDto, AiUsageLogDto } from '@/services/aiGovernanceService';
import { getTenantId } from '@/lib/auth-utils';
import dayjs from 'dayjs';

export default function AiGovernancePage() {
    const { t } = useTranslation();
    const { message } = App.useApp();
    
    const [quota, setQuota] = useState<AiQuotaDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<AiUsageLogDto[]>([]);
    
    const VND_RATE = 25400;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const currentTenantId = getTenantId() || "00000000-0000-0000-0000-000000000001";
            
            const [quotaData, historyData] = await Promise.all([
                aiGovernanceService.getQuota(currentTenantId),
                // Still using dummy history for UI demo unless API added
                Promise.resolve([]) as Promise<AiUsageLogDto[]>
            ]);
            
            setQuota(quotaData);
            setHistory(historyData);
        } catch (error: any) {
             console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const usagePercent = quota ? (quota.currentUsedTokens / quota.monthlyTokenLimit) * 100 : 0;
    const statusColor = usagePercent >= 100 ? '#ff4d4f' : usagePercent >= 90 ? '#faad14' : '#52c41a';

    const chartData = [
        { name: 'Mon', tokens: 45000, cost: 0.5 },
        { name: 'Tue', tokens: 52000, cost: 0.6 },
        { name: 'Wed', tokens: 38000, cost: 0.4 },
        { name: 'Thu', tokens: 85000, cost: 1.2 },
        { name: 'Fri', tokens: 120000, cost: 1.8 },
        { name: 'Sat', tokens: 15000, cost: 0.2 },
        { name: 'Sun', tokens: 12000, cost: 0.1 },
    ];

    return (
        <AccessGuard permission="AdministrationService.AiGovernance.View">
            <div className="flex flex-col gap-6 p-2">
                <div className="flex justify-between items-start">
                    <Space orientation="vertical" size={2}>
                        <Breadcrumb items={[{ title: t('system_admin') }, { title: 'AI Governance' }]} />
                        <h1 className="text-2xl font-bold text-gray-800 m-0">⚡ AI Governance & Tracking</h1>
                    </Space>
                    <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>Làm mới</Button>
                </div>

                {quota?.isBlocked && (
                    <Alert
                        message="Dịch vụ AI đã bị tạm khóa (Hard Limit hit)"
                        description="Hạn mức sử dụng hàng tháng của bạn đã vượt ngưỡng cho phép 100%."
                        type="error"
                        showIcon
                        icon={<WarningOutlined />}
                        className="rounded-lg shadow-sm"
                    />
                )}

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <AppStatCard
                            label="Tổng Token"
                            value={`${(quota?.currentUsedTokens || 0).toLocaleString()} tks`}
                            icon={<BarChartOutlined style={{ color: '#00b5ad' }} />}
                            trend="+12%"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <AppStatCard
                            label="Chi Phí (USD)"
                            value={`$${(quota?.currentUsedCostUsd || 0).toFixed(2)}`}
                            icon={<DollarOutlined style={{ color: '#faad14' }} />}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <AppStatCard
                            label="Chi Phí (VND)"
                            value={`${((quota?.currentUsedCostUsd || 0) * VND_RATE).toLocaleString()} đ`}
                            icon={<DollarOutlined style={{ color: '#52c41a' }} />}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="h-full rounded-xl shadow-sm border-none">
                            <div className="flex flex-col gap-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Hạn mức tháng</span>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold" style={{ color: statusColor }}>{usagePercent.toFixed(1)}%</span>
                                    <span className="text-gray-300 text-[10px] mb-1">/ {quota?.monthlyTokenLimit.toLocaleString()}</span>
                                </div>
                                <Progress 
                                    percent={usagePercent} 
                                    showInfo={false} 
                                    strokeColor={statusColor} 
                                    status={quota?.isBlocked ? "exception" : "active"}
                                    size={{ height: 6 }}
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Card 
                            title={<Space><BarChartOutlined className="text-[#00b5ad]" /> Biểu đồ sử dụng</Space>}
                            className="rounded-xl shadow-sm border-none overflow-hidden"
                            styles={{ body: { padding: '24px 12px 12px 12px' } }}
                        >
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00b5ad" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#00b5ad" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                                        <ChartTooltip 
                                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} 
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="tokens" 
                                            stroke="#00b5ad" 
                                            strokeWidth={4}
                                            fillOpacity={1} 
                                            fill="url(#colorTokens)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                    
                    <Col xs={24} lg={8}>
                        <Card 
                            title={<Space><SettingOutlined className="text-gray-400" /> Hạn mức kỹ thuật</Space>}
                            className="rounded-xl shadow-sm border-none h-full"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex flex-col gap-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Giới hạn Tokens:</span>
                                        <span className="font-bold">{quota?.monthlyTokenLimit.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Giới hạn USD:</span>
                                        <span className="font-bold">${quota?.monthlyCostLimitUsd.toLocaleString()}</span>
                                    </div>
                                    <Divider className="my-1" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold">Đã dùng:</span>
                                        <span className="font-bold text-[#00b5ad]">{quota?.currentUsedTokens.toLocaleString()} tks</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <Button 
                                        block 
                                        type="primary" 
                                        className="h-11 rounded-xl shadow-md border-none"
                                        style={{ background: `linear-gradient(135deg, #00b5ad 0%, #009c95 100%)` }}
                                        icon={<SettingOutlined />}
                                        onClick={() => message.info('Cấu hình sẽ sớm được hỗ trợ')}
                                    >
                                        Điều chỉnh hạn mức
                                    </Button>
                                    
                                    <div className="flex items-center gap-2 p-3 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
                                        <InfoCircleOutlined />
                                        <span>Ngày reset dự kiến: {dayjs().add(12, 'day').format('DD/MM/YYYY')}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </AccessGuard>
    );
}

import { InfoCircleOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
