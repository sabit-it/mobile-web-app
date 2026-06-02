import { useEffect, useState } from 'react';
import { Table, Button, Popconfirm, message, Typography, Rate } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from './adminApi';

interface Review {
  id: string;
  rating: number;
  text: string | null;
  author_id: string;
  recipient_id: string;
  author_name: string;
  recipient_name: string;
  order_id: string;
  created_at: string;
}

export default function Reviews() {
  const [items, setItems] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  async function load(p = page) {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reviews', { params: { limit: 20, offset: (p - 1) * 20 } });
      setItems(data.items ?? data);
      setTotal(data.total ?? data.length);
    } catch {
      message.error('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    try {
      await api.delete(`/admin/reviews/${id}`);
      message.success('Отзыв удалён');
      load();
    } catch {
      message.error('Ошибка');
    }
  }

  const columns: ColumnsType<Review> = [
    {
      title: 'Оценка',
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      render: (v) => <Rate disabled defaultValue={v} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Автор',
      dataIndex: 'author_name',
      key: 'author_name',
      render: (v, r) => <span title={r.author_id}>{v || '—'}</span>,
    },
    {
      title: 'Получатель',
      dataIndex: 'recipient_name',
      key: 'recipient_name',
      render: (v, r) => <span title={r.recipient_id}>{v || '—'}</span>,
    },
    {
      title: 'Комментарий',
      dataIndex: 'text',
      key: 'text',
      render: (v) => v ?? '—',
      ellipsis: true,
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (v) => new Date(v).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, r) => (
        <Popconfirm title="Удалить отзыв?" onConfirm={() => handleDelete(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>Отзывы</Typography.Title>
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
