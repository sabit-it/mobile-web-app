import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin, Alert } from 'antd';
import {
  UserOutlined, ShoppingOutlined, CheckCircleOutlined,
  DollarOutlined, TeamOutlined, RiseOutlined,
} from '@ant-design/icons';
import { api, Stats } from './adminApi';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Stats>('/admin/stats')
      .then((r) => setStats(r.data))
      .catch(() => setError('Не удалось загрузить статистику'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (error) return <Alert type="error" message={error} style={{ margin: 24 }} />;
  if (!stats) return null;

  const cards = [
    { title: 'Всего пользователей', value: stats.total_users, icon: <UserOutlined />, color: '#1677ff' },
    { title: 'Исполнители', value: stats.total_workers, icon: <TeamOutlined />, color: '#52c41a' },
    { title: 'Заказчики', value: stats.total_employers, icon: <UserOutlined />, color: '#722ed1' },
    { title: 'Всего заказов', value: stats.total_orders, icon: <ShoppingOutlined />, color: '#fa8c16' },
    { title: 'Завершено заказов', value: stats.completed_orders, icon: <CheckCircleOutlined />, color: '#13c2c2' },
    { title: 'Отменено заказов', value: stats.cancelled_orders, icon: <RiseOutlined />, color: '#eb2f96' },
    {
      title: 'Комиссии платформы',
      value: parseFloat(stats.total_platform_revenue).toLocaleString('ru-RU') + ' ₽',
      icon: <DollarOutlined />,
      color: '#f5222d',
      isString: true,
    },
    {
      title: 'Общий оборот',
      value: parseFloat(stats.total_volume).toLocaleString('ru-RU') + ' ₽',
      icon: <DollarOutlined />,
      color: '#d46b08',
      isString: true,
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>Обзор платформы</Typography.Title>
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={c.title}>
            <Card>
              <Statistic
                title={c.title}
                value={c.value}
                prefix={<span style={{ color: c.color }}>{c.icon}</span>}
                valueStyle={{ color: c.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
