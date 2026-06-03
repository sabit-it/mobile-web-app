import { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import {
  DashboardOutlined, UserOutlined, ShoppingOutlined,
  DollarOutlined, StarOutlined, AppstoreOutlined, LogoutOutlined,
} from '@ant-design/icons';
import Dashboard from './Dashboard.web';
import Users from './Users.web';
import Orders from './Orders.web';
import Transactions from './Transactions.web';
import Reviews from './Reviews.web';
import Professions from './Professions.web';
import { useAuth } from '../../context/AuthContext';
import { clearTokens } from '../../api/client';

const { Sider, Content } = Layout;

const PAGES: Record<string, JSX.Element> = {
  dashboard: <Dashboard />,
  users: <Users />,
  orders: <Orders />,
  transactions: <Transactions />,
  reviews: <Reviews />,
  professions: <Professions />,
};

export default function AdminPanel() {
  const [page, setPage] = useState('dashboard');
  const { dispatch } = useAuth();

  async function handleLogout() {
    await clearTokens();
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <Layout style={{ height: '100%', background: '#fff' }}>
      <Sider
        width={200}
        style={{ background: '#fff', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}
        breakpoint="md"
        collapsedWidth={0}
      >
        <div style={{ padding: '16px 20px', fontWeight: 800, fontSize: 16, color: '#4F6EF7', borderBottom: '1px solid #f0f0f0' }}>
          💼 Админ
        </div>
        <Menu
          mode="inline"
          selectedKeys={[page]}
          onClick={(e) => setPage(e.key)}
          style={{ borderRight: 0, flex: 1 }}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Обзор' },
            { key: 'users', icon: <UserOutlined />, label: 'Пользователи' },
            { key: 'orders', icon: <ShoppingOutlined />, label: 'Заказы' },
            { key: 'transactions', icon: <DollarOutlined />, label: 'Транзакции' },
            { key: 'reviews', icon: <StarOutlined />, label: 'Отзывы' },
            { key: 'professions', icon: <AppstoreOutlined />, label: 'Профессии' },
          ]}
        />
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
          <Button
            block
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            danger
          >
            Выйти
          </Button>
        </div>
      </Sider>
      <Content style={{ padding: 24, overflowY: 'auto', background: '#f8f9fb' }}>
        {PAGES[page]}
      </Content>
    </Layout>
  );
}
