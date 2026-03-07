'use client';

import React from 'react';
import { Typography, Row, Col, Card, Progress, Table, Avatar, Tag, Timeline } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/ThemeProvider';
import { usePermission } from '@/lib/PermissionProvider';
import { 
    TeamOutlined, 
    FireOutlined, 
    ThunderboltOutlined,
    PlusOutlined,
    CheckCircleFilled,
    WarningFilled,
    UserAddOutlined
} from '@ant-design/icons';
import { AppButton } from './components/common/AppButton';

const { Title, Text } = Typography;

const statsData = [
    {
        title: 'Total Vibes',
        value: '98%',
        change: '+12.5%',
        icon: <FireOutlined />,
        color: '#2BD4BD',
        bg: '#f0fdfa'
    },
    {
        title: 'Project Velocity',
        value: '42 km/h',
        change: '+5.2%',
        icon: <ThunderboltOutlined />,
        color: '#2BD4BD',
        bg: '#f0fdfa'
    },
    {
        title: 'Team Synergy',
        value: '85%',
        change: '-2.1%',
        icon: <TeamOutlined />,
        color: '#f43f5e',
        bg: '#fff1f2',
        hasProgress: true
    }
];

const projectsData = [
    {
        key: '1',
        name: 'Mint Mobile App',
        lead: ['https://randomuser.me/api/portraits/men/32.jpg', 'https://randomuser.me/api/portraits/women/44.jpg'],
        status: 'ON FIRE',
        progress: 68,
        timeline: 'Oct 12 - Dec 20',
        color: '#ff9800'
    },
    {
        key: '2',
        name: 'Vibe Analytics UI',
        lead: ['https://randomuser.me/api/portraits/women/68.jpg'],
        status: 'STEADY',
        progress: 89,
        timeline: 'Nov 01 - Jan 15',
        color: '#2bd4bd'
    },
    {
        key: '3',
        name: 'Retro Brand Kit',
        lead: ['https://randomuser.me/api/portraits/men/45.jpg'],
        status: 'PAUSED',
        progress: 24,
        timeline: 'Jan 10 - Mar 05',
        color: '#94a3b8'
    }
];

export default function Home() {
    const { userName } = usePermission();
    const { primaryColor } = useTheme();

    const columns = [
        {
            title: 'PROJECT NAME',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <div className="flex items-center gap-4 py-1">
                    <Avatar shape="square" size={40} className="flex-none bg-slate-50 text-[12px] font-black text-slate-400 border border-slate-100 uppercase">
                        {text.split(' ')[0][0]}
                    </Avatar>
                    <div className="font-black text-[#1e293b] text-[14px]">{text}</div>
                </div>
            )
        },
        {
            title: 'LEAD',
            dataIndex: 'lead',
            key: 'lead',
            render: (leads: string[]) => (
                <Avatar.Group size="small" max={{ count: 2 }}>
                    {leads.map((u, i) => <Avatar key={i} src={u} />)}
                </Avatar.Group>
            )
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: any) => (
                <div className="inline-flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: record.color }} />
                    <span className="text-[10px] font-black tracking-wider text-slate-500">{status}</span>
                </div>
            )
        },
        {
            title: 'PROGRESS',
            dataIndex: 'progress',
            key: 'progress',
            render: (p: number) => (
                <div className="w-32">
                    <Progress percent={p} strokeColor="#2BD4BD" size="small" showInfo={false} strokeWidth={6} railColor="#f1f5f9" />
                </div>
            )
        },
        {
            title: 'TIMELINE',
            dataIndex: 'timeline',
            key: 'timeline',
            render: (t: string) => (
                <div className="text-[11px] font-bold text-slate-400 leading-relaxed whitespace-pre-line">
                    {t.replace(' - ', '\n')}
                </div>
            )
        }
    ];

    return (
        <Row gutter={[16, 16]}>
            {/* Left Main Content */}
            <Col xs={24} lg={17}>
                <div className="mb-10">
                    <Title level={1} className="!font-black !text-[#1e293b] !mb-2 !text-4xl">
                        Good Morning, {userName?.split(' ')[0] || 'Alex'}! 👋
                    </Title>
                    <Text className="text-slate-400 font-bold text-[15px]">
                        Your vibe score is trending upwards today. Here's a snapshot.
                    </Text>
                </div>

                <Row gutter={[24, 24]} className="mb-12">
                    {statsData.map((stat, i) => (
                        <Col xs={24} sm={8} key={i}>
                            <Card className="!rounded-[32px] border-0 shadow-sm hover:shadow-md transition-shadow" styles={{ body: { padding: 28 } }}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0fdfa', color: '#2BD4BD' }}>
                                        {React.cloneElement(stat.icon as React.ReactElement, { className: 'text-2xl' } as any)}
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-[11px] font-black" style={{ color: stat.color, backgroundColor: stat.bg }}>
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em]">{stat.title}</div>
                                <div className="text-[#1e293b] text-4xl font-black mt-2">{stat.value}</div>
                                
                                {stat.hasProgress ? (
                                    <div className="mt-8">
                                        <Progress percent={85} strokeColor="#2BD4BD" showInfo={false} size={8} railColor="#f1f5f9" />
                                        <div className="flex justify-between mt-3">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Optimal Range</span>
                                            <span className="text-[9px] font-black text-[#2bd4bd] uppercase tracking-widest">Good</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-8 h-12 flex items-end gap-1.5 px-1">
                                        {[35, 50, 30, 70, 45, 60, 85].map((h, idx) => (
                                            <div key={idx} className="flex-1 rounded-full" style={{ height: `${h}%`, backgroundColor: idx === 6 ? primaryColor : '#f1f5f9' }} />
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Card className="!rounded-[32px] border-0 shadow-sm overflow-hidden" styles={{ body: { padding: 0 } }}>
                    <div className="p-10 flex flex-wrap justify-between items-center bg-white">
                        <div>
                            <Title level={3} className="!font-black !text-[#1e293b] !mb-1">Project Overview</Title>
                            <Text className="text-slate-400 font-bold text-sm">Managing active initiatives across the team</Text>
                        </div>
                        <AppButton 
                            btnType="vibe" 
                            icon={<PlusOutlined />}
                            className="!rounded-2xl h-12 px-8 shadow-lg shadow-[#2bd4bd44]"
                        >
                            NEW PROJECT
                        </AppButton>
                    </div>

                    <div className="px-6 pb-6">
                        <Table 
                            columns={columns} 
                            dataSource={projectsData} 
                            pagination={false}
                            className="custom-app-grid"
                        />
                    </div>
                </Card>
            </Col>

            {/* Right Sidebar */}
            <Col xs={24} lg={7}>
                <div className="space-y-12">
                    {/* Recent Activity */}
                    <section>
                        <Title level={4} className="!font-black !text-[#1e293b] !mb-8">Recent Activity</Title>
                        <Timeline
                            items={[
                                {
                                    dot: <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircleFilled /></div>,
                                    children: (
                                        <div className="pl-2">
                                            <div className="font-black text-[#1e293b] text-[14px]">Task completed</div>
                                            <div className="text-slate-400 text-[12px] font-bold mt-1">Sarah finalized the login flow for Mint App</div>
                                            <div className="text-slate-300 text-[10px] uppercase font-black tracking-widest mt-2 px-1">2 mins ago</div>
                                        </div>
                                    ),
                                },
                                {
                                    dot: <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><WarningFilled /></div>,
                                    children: (
                                        <div className="pl-2">
                                            <div className="font-black text-[#1e293b] text-[14px]">Deadline alert</div>
                                            <div className="text-slate-400 text-[12px] font-bold mt-1">Vibe Analytics UI review is due in 3 hours</div>
                                            <div className="text-slate-300 text-[10px] uppercase font-black tracking-widest mt-2 px-1">45 mins ago</div>
                                        </div>
                                    ),
                                },
                                {
                                    dot: <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><UserAddOutlined /></div>,
                                    children: (
                                        <div className="pl-2">
                                            <div className="font-black text-[#1e293b] text-[14px]">New member</div>
                                            <div className="text-slate-400 text-[12px] font-bold mt-1">Jordan joined the Design Team</div>
                                            <div className="text-slate-300 text-[10px] uppercase font-black tracking-widest mt-2 px-1">2 hours ago</div>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </section>

                    {/* Upcoming Vibe Checks */}
                    <section>
                        <Title level={4} className="!font-black !text-[#1e293b] !mb-8">Upcoming Vibe Checks</Title>
                        <Card className="!rounded-[24px] border-2 border-dashed border-slate-100 shadow-none bg-slate-50/30" styles={{ body: { padding: 24 } }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <div className="font-black text-[#1e293b] text-[14px]">Bi-Weekly Sync</div>
                            </div>
                            <Text className="text-slate-400 font-bold text-[12px] leading-relaxed block mb-6">
                                Discussing the overall synergy and identifying any bottlenecks in current workflows.
                            </Text>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <Avatar.Group size="small">
                                    <Avatar src="https://randomuser.me/api/portraits/women/12.jpg" />
                                    <Avatar src="https://randomuser.me/api/portraits/men/22.jpg" />
                                    <Avatar src="https://randomuser.me/api/portraits/women/32.jpg" />
                                </Avatar.Group>
                                <div className="text-[#2bd4bd] text-[10px] font-black uppercase tracking-widest">Tomorrow 10:00 AM</div>
                            </div>
                        </Card>
                    </section>
                </div>
            </Col>
        </Row>
    );
}