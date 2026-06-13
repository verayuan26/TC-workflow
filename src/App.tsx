import { SessionProvider, useSession } from './context/SessionContext';
import { RoleDisplayProvider } from './context/RoleDisplayContext';
import { LoginPage } from './pages/LoginPage';
import { RoleFlowPage } from './pages/role/RoleFlowPage';
import { AdminWorkspace } from './pages/admin/AdminWorkspace';

function AppRoutes() {
  const { role } = useSession();
  if (!role) return <LoginPage />;
  if (role === 'ADMIN') return <AdminWorkspace />;
  return <RoleFlowPage />;
}

export default function App() {
  return (
    <RoleDisplayProvider>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </RoleDisplayProvider>
  );
}
