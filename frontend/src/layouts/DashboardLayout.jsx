import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import NotificationPrompt from '../components/NotificationPrompt';

const DashboardLayout = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '24px 24px', maxWidth: 1400, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <Outlet />
      </main>
      <NotificationPrompt />
    </div>
  );
};

export default DashboardLayout;
