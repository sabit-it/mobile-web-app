import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber,
  Switch, Popconfirm, message, Typography, Space, Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api, Profession } from './adminApi';

export default function Professions() {
  const [items, setItems] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profession | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/professions');
      setItems(data.items ?? data);
    } catch {
      message.error('Не удалось загрузить профессии');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setModalOpen(true);
  }

  function openEdit(p: Profession) {
    setEditing(p);
    form.setFieldsValue({ name: p.name, hourly_rate: parseFloat(p.hourly_rate), is_active: p.is_active });
    setModalOpen(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/admin/professions/${editing.id}`, values);
        message.success('Профессия обновлена');
      } else {
        await api.post('/admin/professions', values);
        message.success('Профессия создана');
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      message.error(e.response?.data?.detail ?? 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/admin/professions/${id}`);
      message.success('Профессия деактивирована');
      load();
    } catch {
      message.error('Ошибка');
    }
  }

  const columns: ColumnsType<Profession> = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    {
      title: 'Ставка',
      dataIndex: 'hourly_rate',
      key: 'hourly_rate',
      render: (v) => `${parseFloat(v).toLocaleString('ru-RU')} ₽/ч`,
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активна' : 'Отключена'}</Tag>,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Изменить</Button>
          {r.is_active && (
            <Popconfirm title="Деактивировать профессию?" onConfirm={() => handleDelete(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Профессии</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Добавить</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={false} />

      <Modal
        title={editing ? 'Редактировать профессию' : 'Новая профессия'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Обязательно' }]}>
            <Input placeholder="Сантехник" />
          </Form.Item>
          <Form.Item name="hourly_rate" label="Ставка (₽/ч)" rules={[{ required: true, message: 'Обязательно' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="500" />
          </Form.Item>
          <Form.Item name="is_active" label="Активна" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
