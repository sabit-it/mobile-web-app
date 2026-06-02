import { useEffect, useState } from 'react';
import { Table, Tag, Select, Typography, message, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api, Transaction } from './adminApi';

const TYPE_LABEL: Record<string, string> = {
  deposit: 'Пополнение',
  withdrawal: 'Вывод',
  order_settlement: 'Заработок',
};
const TYPE_COLOR: Record<string, string> = {
  deposit: 'blue',
  withdrawal: 'red',
  order_settlement: 'green',
};

export default function Transactions() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string | undefined>();

  async function load(p = page, t = type) {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 20, offset: (p - 1) * 20 };
      if (t) params.type = t;
      const { data } = await api.get('/admin/transactions', { params });
      setItems(data.items ?? data);
      setTotal(data.total ?? data.length);
    } catch {
      message.error('Не удалось загрузить транзакции');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (v) => <Tag color={TYPE_COLOR[v] ?? 'default'}>{TYPE_LABEL[v] ?? v}</Tag>,
    },
    {
      title: 'От кого',
      dataIndex: 'payer_name',
      key: 'payer_name',
      render: (v, r) => <span title={String(r.payer_id)}>{v || '—'}</span>,
    },
    {
      title: 'Кому',
      dataIndex: 'receiver_name',
      key: 'receiver_name',
      render: (v, r) => <span title={String(r.receiver_id)}>{v || '—'}</span>,
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (v) => `${parseFloat(v).toLocaleString('ru-RU')} ₽`,
    },
    {
      title: 'Комиссия',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      render: (v) => parseFloat(v) > 0 ? `${parseFloat(v).toLocaleString('ru-RU')} ₽` : '—',
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => new Date(v).toLocaleString('ru-RU'),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>Транзакции</Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Тип"
          allowClear
          style={{ width: 180 }}
          onChange={(v) => { setType(v); setPage(1); load(1, v); }}
          options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
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
