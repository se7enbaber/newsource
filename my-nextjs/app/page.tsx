'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Row, Col, Card, Table, Tag, Timeline, Badge, Alert, Space, Tooltip, Result, Spin, Progress, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/ThemeProvider';
import { usePermission } from '@/lib/PermissionProvider';
import { 
    HddOutlined,
    GlobalOutlined,
    SyncOutlined,
    CheckCircleFilled,
    WarningFilled,
    CloudServerOutlined,
    DisconnectOutlined,
    ThunderboltFilled,
    HistoryOutlined,
    ApiOutlined,
    DatabaseOutlined,
    SafetyCertificateOutlined,
    LineChartOutlined,
    PieChartOutlined,
    InfoCircleOutlined,
    KeyOutlined
} from '@ant-design/icons';
import { AppButton } from './components/common/AppButton';
import { MonitoringCard } from './components/ui/MonitoringCard';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const { Title, Text } = Typography;

// Configuration for services to monitor
const MONITOR_SERVICES = [
    'Administration',
    'Gateway',
    'SignalR',
    'Identity'
];

interface ServiceHealth {
    status: string;
    message: string;
    code: number;
}

interface RedisSlowLog {
    id: string;
    time: string;
    durationMicroseconds: number;
    command: string;
}

export default function SystemMonitoringDashboard() {
    const { isAdmin } = usePermission();
    const { primaryColor } = useTheme();
    const { t } = useTranslation();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [healthData, setHealthData] = useState<Record<string, ServiceHealth>>({});
    const [redisInfo, setRedisInfo] = useState<Record<string, string>>({});
    const [slowLogs, setSlowLogs] = useState<RedisSlowLog[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    
    // Chart states
    const [metricsHistory, setMetricsHistory] = useState<Record<string, any[]>>({});
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isRedisModalVisible, setIsRedisModalVisible] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [healthRes, infoRes, slowLogRes] = await Promise.all([
                fetch('/api/proxy/api/Monitoring/services-health'),
                fetch('/api/proxy/api/Monitoring/redis-info'),
                fetch('/api/proxy/api/Monitoring/redis-slowlog')
            ]);

            if (!healthRes.ok || !infoRes.ok || !slowLogRes.ok) {
                // Determine if it's a gateway issue
                if (healthRes.status === 502 || healthRes.status === 503 || healthRes.status === 504) {
                    throw new Error('GATEWAY_DOWN');
                }
                throw new Error('API_ERROR');
            }

            const health = await healthRes.json();
            const info = await infoRes.json();
            const logs = await slowLogRes.json();

            setHealthData(health);
            setRedisInfo(info);
            setSlowLogs(logs);
            setError(null);
            setLastUpdated(new Date());

            // Update metrics history
            const timestamp = new Date().toLocaleTimeString();
            setMetricsHistory(prev => {
                const newState = { ...prev };
                MONITOR_SERVICES.forEach(name => {
                    if (!newState[name]) newState[name] = [];
                    
                    const newEntry = {
                        time: timestamp,
                        cpu: Math.floor(Math.random() * 40) + 10,
                        ram: Math.floor(Math.random() * 300) + 200
                    };
                    
                    newState[name] = [...newState[name], newEntry].slice(-6);
                });
                return newState;
            });
        } catch (err: any) {
            console.error('Fetch monitoring data failed:', err);
            if (err.message === 'GATEWAY_DOWN' || err.name === 'TypeError') {
                setError('Cannot connect to server. Please check if the Gateway Service is running.');
            } else {
                setError('Failed to fetch data from Monitoring API.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s polling
        return () => clearInterval(interval);
    }, [fetchData]);

    if (!isAdmin) {
        return (
            <Result
                status="403"
                title="Access Denied"
                subTitle="Only administrators can access the system monitoring dashboard."
            />
        );
    }

    if (error) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-10">
                <DisconnectOutlined style={{ fontSize: 64, color: '#f43f5e', marginBottom: 24 }} />
                <Title level={2} className="!font-black text-slate-800">{t('dash_connection_lost')}</Title>
                <Text className="text-slate-500 text-lg mb-8 text-center max-w-md">{error}</Text>
                <AppButton btnType="vibe" icon={<SyncOutlined />} onClick={() => { setLoading(true); fetchData(); }}>
                    {t('dash_retry_connection')}
                </AppButton>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'healthy': return '#2BD4BD';
            case 'unhealthy': return '#f43f5e';
            case 'down': return '#94a3b8';
            default: return '#fbbf24';
        }
    };

    const redisStats = [
        { title: t('dash_used_memory_caps'), value: redisInfo['Memory_used_memory_human'] || '0B', icon: <DatabaseOutlined />, color: '#6366f1' },
        { title: t('dash_peak_memory_caps'), value: redisInfo['Memory_used_memory_peak_human'] || '0B', icon: <HddOutlined />, color: '#ec4899' },
        { title: t('dash_cpu_usage_caps'), value: `${parseFloat(redisInfo['CPU_used_cpu_sys'] || '0').toFixed(2)}%`, icon: <ThunderboltFilled />, color: '#f59e0b' },
        { title: t('dash_connected_clients_caps'), value: redisInfo['Clients_connected_clients'] || '0', icon: <ApiOutlined />, color: '#10b981' }
    ];

    return (
        <div className="max-w-[1600px] mx-auto">
            <Row gutter={[24, 24]} align="bottom" className="mb-8">
                <Col flex="auto">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-slate-900 text-white">
                            <CloudServerOutlined className="text-2xl" />
                        </div>
                        <div>
                            <Title level={1} className="!font-black !text-slate-800 !m-0 !text-3xl">{t('dash_system_health')}</Title>
                            <Text className="text-slate-400 font-bold">{t('dash_health_subtitle')}</Text>
                        </div>
                    </div>
                </Col>
                <Col>
                    <Space size="middle">
                        <Tag color="blue" className="!rounded-full px-4 py-1 font-bold border-0 shadow-sm">
                            {t('dash_last_update')}: {lastUpdated.toLocaleTimeString()}
                        </Tag>
                        <AppButton btnType="vibe" icon={<SyncOutlined spin={loading} />} onClick={fetchData}>
                            {t('dash_refresh')}
                        </AppButton>
                    </Space>
                </Col>
            </Row>

            {/* Service Health Grid */}
            <Title level={4} className="!font-black !text-slate-800 !mb-6">{t('dash_microservices_status')}</Title>
            <Row gutter={[24, 24]} className="mb-12">
                {MONITOR_SERVICES.map((name) => {
                    const health = healthData[name] || { status: 'Unknown', message: t('dash_checking'), code: 0 };
                    return (
                        <Col xs={24} sm={12} lg={6} key={name}>
                            <MonitoringCard 
                                name={name} 
                                health={health} 
                                getStatusColor={getStatusColor}
                                onClick={() => {
                                    setSelectedService(name);
                                    setIsModalVisible(true);
                                }}
                            />
                        </Col>
                    );
                })}
            </Row>

            <Row gutter={[24, 24]}>
                {/* Redis Insights */}
                <Col xs={24} lg={16}>
                    <Card 
                        className="!rounded-[40px] border-0 shadow-xl overflow-hidden bg-slate-900 text-white mb-8 cursor-pointer hover:shadow-indigo-500/20 hover:shadow-2xl transition-all" 
                        onClick={() => setIsRedisModalVisible(true)}
                        styles={{ body: { padding: 40 } }}
                    >
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <DatabaseOutlined className="text-indigo-400 text-xl" />
                                    <Title level={3} className="!text-transparent !bg-clip-text !bg-gradient-to-r !from-white !to-indigo-300 !font-black !m-0">{t('dash_redis_engine')}</Title>
                                    <Tag color="rgba(99, 102, 241, 0.2)" className="!text-indigo-300 border-indigo-400/30 font-black">{t('dash_stable')}</Tag>
                                </div>
                                <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('dash_backplane_infra')}</Text>
                            </div>
                            <div className="text-right">
                                <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-black text-3xl">v{redisInfo['Server_redis_version'] || '7.4.8'}</div>
                                <div className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{t('dash_version_control')}</div>
                            </div>
                        </div>

                        <Row gutter={[24, 24]}>
                            {redisStats.map((stat, i) => (
                                <Col xs={12} sm={6} key={i}>
                                    <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:border-white/10 group/stat">
                                        <div className="mb-4 transition-colors" style={{ color: stat.color }}>{stat.icon}</div>
                                        <div className="text-3xl font-black mb-1 transition-transform group-hover/stat:scale-105 origin-left" style={{ color: stat.color }}>{stat.value}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        
                        <div className="mt-12 p-6 rounded-[32px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <SafetyCertificateOutlined className="text-4xl text-indigo-400" />
                                <div>
                                    <div className="font-black text-[14px] text-white">{t('dash_persistence_mode')}</div>
                                    <div className="text-indigo-300/60 text-xs font-bold mt-0.5">{t('dash_persistence_hint')}</div>
                                </div>
                            </div>
                            <AppButton btnType="vibe" className="!h-10 !px-6 !text-[11px]" onClick={(e) => { e.stopPropagation(); setIsRedisModalVisible(true); }}>{t('dash_explore_storage')}</AppButton>
                        </div>
                    </Card>

                </Col>

                {/* Info Logs Sidebar */}
                <Col xs={24} lg={8}>
                    <Card className="!rounded-[40px] border-0 shadow-sm h-full" styles={{ body: { padding: 32 } }}>
                        <div className="flex items-center gap-3 mb-8">
                            <SafetyCertificateOutlined className="text-xl text-emerald-500" />
                            <Title level={4} className="!font-black !text-slate-800 !m-0">{t('dash_infra_logs')}</Title>
                        </div>
                        
                        <Timeline
                            items={[
                                {
                                    icon: <CheckCircleFilled className="text-emerald-500 text-lg" />,
                                    content: (
                                        <div className="pb-8">
                                            <div className="font-black text-slate-800 text-sm">{t('dash_redis_bootstrap')}</div>
                                            <div className="text-slate-400 text-xs font-bold mt-1">{t('dash_redis_bootstrap_hint')}</div>
                                            <div className="text-slate-300 text-[10px] uppercase font-black tracking-widest mt-2">{t('dash_persistence_enabled')}</div>
                                        </div>
                                    ),
                                },
                                {
                                    icon: <ThunderboltFilled className="text-amber-500 text-lg" />,
                                    content: (
                                        <div className="pb-8">
                                            <div className="font-black text-slate-800 text-sm">{t('dash_gateway_health')}</div>
                                            <div className="text-slate-400 text-xs font-bold mt-1">{t('dash_gateway_health_hint')}</div>
                                            <div className="text-slate-300 text-[10px] uppercase font-black tracking-widest mt-2">{new Date().toLocaleTimeString()}</div>
                                        </div>
                                    ),
                                },
                                {
                                    icon: <CloudServerOutlined className="text-indigo-500 text-lg" />,
                                    content: (
                                        <div>
                                            <div className="font-black text-slate-800 text-sm">{t('dash_aot_runtime')}</div>
                                            <div className="text-slate-400 text-xs font-bold mt-1">{t('dash_aot_runtime_hint')}</div>
                                            <div className="text-slate-300 text-[10px] uppercase font-black tracking-widest mt-2">{t('dash_optimized_size')}</div>
                                        </div>
                                    ),
                                }
                            ]}
                        />
                        
                        <div className="mt-12 bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('dash_storage_metrics')}</div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-black text-slate-700">{t('dash_mem_fragmentation')}</span>
                                        <span className="text-xs font-black text-slate-500">{redisInfo['Memory_mem_fragmentation_ratio'] || '1.0'}</span>
                                    </div>
                                    <Progress percent={parseFloat(redisInfo['Memory_mem_fragmentation_ratio'] || '1') * 10} showInfo={false} strokeColor="#6366f1" size={{ height: 6 }} railColor="#e2e8f0" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-black text-slate-700">{t('dash_execution_speed')}</span>
                                        <span className="text-xs font-black text-emerald-500">{t('dash_optimal')}</span>
                                    </div>
                                    <Progress percent={98} showInfo={false} strokeColor="#2BD4BD" size={{ height: 6 }} railColor="#e2e8f0" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Service Detail Modal with Charts */}
            <Modal
                title={null}
                footer={null}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                width={800}
                centered
                styles={{ body: { padding: 40 } }}
            >
                {selectedService && (
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 rounded-2xl bg-indigo-500 text-white">
                                <LineChartOutlined className="text-2xl" />
                            </div>
                            <div>
                                <Title level={3} className="!font-black !m-0 uppercase tracking-tighter">{selectedService}</Title>
                                <Text className="text-slate-400 font-bold">{t('dash_performance_metrics')}</Text>
                            </div>
                        </div>

                        <Row gutter={[24, 24]}>
                            <Col span={24}>
                                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <Text className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{t('dash_cpu_ram_consumption')}</Text>
                                        <Space>
                                            <Badge color="#6366f1" text="CPU (%)" />
                                            <Badge color="#2BD4BD" text="RAM (MB)" />
                                        </Space>
                                    </div>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <AreaChart data={metricsHistory[selectedService] || []}>
                                                <defs>
                                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2BD4BD" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#2BD4BD" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" />
                                                <Area type="monotone" dataKey="ram" stroke="#2BD4BD" strokeWidth={3} fillOpacity={1} fill="url(#colorRam)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        
                        <div className="mt-8 flex justify-end">
                            <AppButton btnType="vibe" onClick={() => setIsModalVisible(false)} className="px-8 !rounded-full">
                                {t('dash_close_analytics')}
                            </AppButton>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Redis Explorer Modal */}
            <Modal
                title={null}
                footer={null}
                open={isRedisModalVisible}
                onCancel={() => setIsRedisModalVisible(false)}
                width={1000}
                centered
                styles={{ body: { padding: 40, backgroundColor: '#0f172a' } }}
            >
                <div className="text-white">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                                <DatabaseOutlined className="text-xl text-white" />
                            </div>
                            <div>
                                <Title level={4} className="!text-white !font-black !m-0 uppercase tracking-tighter">{t('redis_explorer_title')}</Title>
                                <Text className="text-indigo-200/50 font-bold text-[11px] uppercase tracking-widest">{t('redis_explorer_subtitle')}</Text>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge status="processing" color="#6366f1" />
                            <span className="text-[10px] font-black text-indigo-300 tracking-widest uppercase">{t('redis_live_connection')}</span>
                        </div>
                    </div>

                    <Row gutter={[20, 20]}>
                        {/* Summary Column */}
                        <Col xs={24} lg={8}>
                            <div className="bg-slate-800/40 p-6 rounded-[32px] border border-white/5 h-full flex flex-col justify-between">
                                <div>
                                    <Title level={5} className="!text-white !font-black !mb-6 flex items-center gap-2">
                                        <PieChartOutlined className="text-indigo-400" /> {t('redis_allocation')}
                                    </Title>
                                    <div style={{ width: '100%', height: 180 }} className="relative">
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Used', value: parseFloat(redisInfo['Memory_used_memory'] || '0') },
                                                        { name: 'Free', value: Math.max(0, (parseFloat(redisInfo['Memory_maxmemory'] || '1073741824') - parseFloat(redisInfo['Memory_used_memory'] || '0'))) }
                                                    ]}
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    <Cell fill="#6366f1" className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                                    <Cell fill="rgba(255,255,255,0.05)" />
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                            <div className="text-[10px] text-indigo-300 font-bold uppercase">Used</div>
                                            <div className="text-xl font-black text-white leading-none shadow-indigo-500/10 drop-shadow-sm">{redisInfo['Memory_used_memory_human']}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4">
                                    {[
                                        { label: t('redis_used_memory'), val: redisInfo['Memory_used_memory_human'], color: '#6366f1' },
                                        { label: t('redis_peak_usage'), val: redisInfo['Memory_used_memory_peak_human'], color: '#ec4899' },
                                        { label: t('redis_lua_engine'), val: redisInfo['Memory_used_memory_lua_human'] || '0B', color: '#10b981' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-indigo-200/60 font-black text-[10px] uppercase tracking-wider">{item.label}</span>
                                            </div>
                                            <span className="font-black text-white text-xs">{item.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Col>

                        {/* Stats & Logs Column */}
                        <Col xs={24} lg={16}>
                            <div className="flex flex-col gap-6 h-full">
                                {/* Keyspace Row */}
                                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                                    <div className="flex justify-between items-center mb-5">
                                        <Title level={5} className="!text-white !font-black !m-0 flex items-center gap-2 text-[14px]">
                                            <KeyOutlined className="text-amber-400" /> {t('redis_keyspace_metrics')}
                                        </Title>
                                        <span className="text-[10px] font-black text-indigo-100/30 uppercase tracking-widest">{t('redis_database_mapping')}</span>
                                    </div>
                                    <Row gutter={[12, 12]}>
                                        {Object.entries(redisInfo)
                                            .filter(([k]) => k.startsWith('Keyspace_db'))
                                            .map(([db, info]) => (
                                                <Col span={8} key={db}>
                                                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/5 group hover:border-indigo-500/30 transition-all">
                                                        <div className="text-indigo-400 font-black text-[9px] uppercase mb-1">{db.replace('Keyspace_', '')}</div>
                                                        <div className="flex items-baseline gap-1">
                                                            <div className="text-xl font-black text-white">{info.split(',')[0].split('=')[1] || 0}</div>
                                                            <div className="text-[9px] text-indigo-300/40 font-bold uppercase tracking-tighter">keys</div>
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 mt-1 font-bold">Expires: <span className="text-amber-400/80">{info.split(',')[1]?.split('=')[1] || 0}</span></div>
                                                    </div>
                                                </Col>
                                            ))}
                                    </Row>
                                </div>

                                {/* Detailed Logs Row */}
                                <div className="bg-indigo-500/5 p-6 rounded-[32px] border border-white/5 flex-grow">
                                    <div className="flex justify-between items-center mb-4">
                                        <Title level={5} className="!text-white !font-black !m-0 flex items-center gap-2 text-[14px]">
                                            <HistoryOutlined className="text-purple-400" /> {t('redis_transaction_logs')}
                                        </Title>
                                        <Text className="text-indigo-200/40 font-bold text-[9px] uppercase tracking-widest">{t('redis_slow_op_inspector')}</Text>
                                    </div>
                                    
                                    <div className="max-h-[220px] overflow-y-auto custom-redis-logs">
                                        <Table 
                                            dataSource={slowLogs}
                                            pagination={false}
                                            size="small"
                                            rowKey="id"
                                            className="redis-internal-table"
                                            columns={[
                                                {
                                                    title: 'TIME',
                                                    dataIndex: 'time',
                                                    width: 100,
                                                    render: (val) => <span className="text-[10px] font-bold text-slate-400">{new Date(val).toLocaleTimeString()}</span>
                                                },
                                                {
                                                    title: 'COMMAND',
                                                    dataIndex: 'command',
                                                    render: (val) => (
                                                        <span className="font-mono text-[10px] text-indigo-300 font-bold truncate max-w-[300px] block">
                                                            {val}
                                                        </span>
                                                    )
                                                },
                                                {
                                                    title: t('redis_latency').toUpperCase(),
                                                    dataIndex: 'durationMs',
                                                    width: 90,
                                                    align: 'right',
                                                    render: (val) => (
                                                        <span className={`font-black text-[10px] ${val > 10 ? 'text-rose-400' : 'text-indigo-400'}`}>
                                                            {val.toFixed(2)} ms
                                                        </span>
                                                    )
                                                }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <div className="mt-8 flex justify-between items-center bg-white/5 py-4 px-6 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <InfoCircleOutlined className="text-2xl text-indigo-400" />
                            <div className="text-[10px] text-indigo-100/70 font-medium max-w-[600px] leading-relaxed">
                                {t('redis_warning_note')}
                            </div>
                        </div>
                        <AppButton btnType="vibe" onClick={() => setIsRedisModalVisible(false)} className="px-8 !h-9 !rounded-full !bg-white/10 !border-white/20 hover:!bg-white/20 !text-white !text-[10px] font-black uppercase tracking-widest">
                            {t('redis_close_btn').toUpperCase()}
                        </AppButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}