import { useEffect, useRef, useState } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, Popconfirm,
  message, Typography, Badge,
} from 'antd';
import { SearchOutlined, StopOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api, User } from './adminApi';

const ROLE_COLOR: Record<string, string> = { employer: 'blue', worker: 'green', admin: 'red' };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string | undefined>();
  const [isBlocked, setIsBlocked] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load(p = page, r = role, b = isBlocked, s = search) {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 20, offset: (p - 1) * 20 };
      if (r) params.role = r;
      if (b !== undefined && b !== '') params.is_blocked = b;
      if (s) params.search = s;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.items ?? data);
      setTotal(data.total ?? data.length);
    } catch {
      message.error('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSearch(v: string) {
    setSearch(v);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setPage(1); load(1, role, isBlocked, v); }, 400);
  }

  async function handleBlock(id: string, block: boolean) {
    try {
      await api.patch(`/admin/users/${id}/block`, { is_blocked: block });
      message.success(block ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      load();
    } catch {
      message.error('Ошибка');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/admin/users/${id}`);
      message.success('Пользователь деактивирован');
      load();
    } catch {
      message.error('Ошибка');
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: 'Пользователь',
      key: 'name',
      render: (_, r) => <span>{r.last_name} {r.first_name}</span>,
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (v) => <Tag color={ROLE_COLOR[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, r) => (
        !r.is_active
          ? <Badge status="default" text="Удалён" />
          : r.is_admin
          ? <Badge status="warning" text="Админ" />
          : <Badge status="success" text="Активен" />
      ),
    },
    {
      title: 'Баланс',
      dataIndex: 'balance',
      key: 'balance',
      render: (v) => `${parseFloat(v).toLocaleString('ru-RU')} ₽`,
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => new Date(v).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, r) => (
        <Space>
          {r.is_active && !r.is_admin && (
            <Popconfirm
              title={r.is_active ? 'Заблокировать?' : 'Разблокировать?'}
              onConfirm={() => handleBlock(r.id, true)}
            >
              <Button size="small" danger icon={<StopOutlined />}>Блок</Button>
            </Popconfirm>
          )}
          {!r.is_active && (
            <Popconfirm title="Разблокировать?" onConfirm={() => handleBlock(r.id, false)}>
              <Button size="small" icon={<CheckOutlined />}>Разблок</Button>
            </Popconfirm>
          )}
          {r.is_active && !r.is_admin && (
            <Popconfirm title="Деактивировать пользователя?" onConfirm={() => handleDelete(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>Пользователи</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Поиск по имени / email"
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
        <Select
          placeholder="Роль"
          allowClear
          style={{ width: 140 }}
          onChange={(v) => { setRole(v); setPage(1); load(1, v, isBlocked, search); }}
          options={[
            { value: 'employer', label: 'Заказчик' },
            { value: 'worker', label: 'Исполнитель' },
          ]}
        />
        <Select
          placeholder="Статус"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => { setIsBlocked(v); setPage(1); load(1, role, v, search); }}
          options={[
            { value: 'false', label: 'Активные' },
            { value: 'true', label: 'Заблокированные' },
          ]}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
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
