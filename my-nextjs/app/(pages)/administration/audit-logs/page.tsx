'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Typography, Card, DatePicker, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AppGrid } from '@/app/components/common/AppGrid';
import { AppToolbar } from '@/app/components/common/AppToolbar';
import { useTranslation } from 'react-i18next';
import { useNotification } from '@/lib/NotificationProvider';
import { AccessGuard } from '@/lib/AccessGuard';

const { Title } = Typography;

export default function JobLogsPage() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [currentPagination, setCurrentPagination] = useState({ current: 1, pageSize: 10 });
    const { connection } = useNotification();

    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs().startOf('day'), dayjs().endOf('day')]);

    const fetchLogs = async (page = currentPagination.current, pageSize = currentPagination.pageSize) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            let url = `/api/proxy/api/JobLogs?pageNumber=${page}&pageSize=${pageSize}`;
            if (dateRange && dateRange[0] && dateRange[1]) {
                const fDate = dateRange[0].startOf('day').toISOString();
                const tDate = dateRange[1].endOf('day').toISOString();
                url += `&fromDate=${encodeURIComponent(fDate)}&toDate=${encodeURIComponent(tDate)}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setLogs(data.items || []);
            setTotal(data.totalCount || 0);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(currentPagination.current, currentPagination.pageSize);

        if (connection) {
            connection.on('ReceiveJobStatus', () => {
                fetchLogs(currentPagination.current, currentPagination.pageSize);
            });
        }
    }, [connection, currentPagination]);

    const columns = [
        {
            title: 'Job Name',
            dataIndex: 'jobName',
            key: 'jobName',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'blue';
                if (status === 'Success') color = 'green';
                if (status === 'Failed') color = 'red';
                if (status === 'Running') color = 'orange';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Message',
            dataIndex: 'message',
            key: 'message',
        },
        {
            title: 'Started At',
            dataIndex: 'startedAt',
            key: 'startedAt',
            render: (date: string) => date ? new Date(date).toLocaleString() : '-',
        },
        {
            title: 'Completed At',
            dataIndex: 'completedAt',
            key: 'completedAt',
            render: (date: string) => date ? new Date(date).toLocaleString() : '-',
        }
    ];

    return (
        <AccessGuard permission="AdministrationService.JobLogs.View" hostOnly={true}>
            <Card>
                <AppToolbar
                    showSearch={false}
                    leftActions={<Title level={4} style={{ margin: 0 }}>Lịch sử Jobs (Hangfire)</Title>}
                    extraActions={
                        <Space>
                            <DatePicker.RangePicker 
                                value={dateRange}
                                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                                format="DD/MM/YYYY"
                                allowClear={false}
                            />
                            <Button 
                                type="primary" 
                                icon={<SearchOutlined />} 
                                onClick={() => {
                                    setCurrentPagination({ ...currentPagination, current: 1 });
                                    fetchLogs(1, currentPagination.pageSize);
                                }} 
                                className="bg-[#2bd4bd] border-none"
                            />
                        </Space>
                    }
                />
                <AppGrid
                    dataSource={logs}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ 
                        current: currentPagination.current,
                        pageSize: currentPagination.pageSize,
                        total: total,
                        onChange: (page, pageSize) => {
                            setCurrentPagination({ current: page, pageSize });
                        }
                    }}
                />
            </Card>
        </AccessGuard>
    );
}
