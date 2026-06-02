import { useEffect, useState } from 'react';
import { Table, Tag, Select, Typography, message, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api, Order } from './adminApi';

const STATUS_COLOR: Record<string, string> = {
  pending_offer: 'gold',
  assigned: 'blue',
  completed: 'green',
  cancelled: 'red',
  no_workers_available: 'volcano',
};

const STATUS_LABEL: Record<string, string> = {
  pending_offer: 'Ищем исполнителя',
  assigned: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
  no_workers_available: 'Нет исполнителей',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();

  async function load(p = page, s = status) {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 20, offset: (p - 1) * 20 };
      if (s) params.status = s;
      const { data } = await api.get('/admin/orders', { params });
      setOrders(data.items ?? data);
      setTotal(data.total ?? data.length);
    } catch {
      message.error('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const columns: ColumnsType<Order> = [
    { title: 'Название', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? v}</Tag>,
    },
    {
      title: 'Сумма',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (v) => `${parseFloat(v).toLocaleString('ru-RU')} ₽`,
    },
    { title: 'Адрес', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => new Date(v).toLocaleDateString('ru-RU'),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>Заказы</Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Статус"
          allowClear
          style={{ width: 200 }}
          onChange={(v) => { setStatus(v); setPage(1); load(1, v); }}
          options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{
          total,
          pageSize: 20,
          current: page,
          onChange: (p) => { setPage(p); load(p); },
          showTotal: (t) => `Всего: ${t}`,
        }}
      />
    </div>
  );
}
