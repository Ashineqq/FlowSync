import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import Login from '@/pages/login';
import Overview from '@/pages/Overview';
import ProjectList from '@/pages/ProjectList';
import TaskBreakdown from '@/pages/TaskBreakdown';
import TaskList from '@/pages/TaskList';
import TaskLogList from '@/pages/TaskLogList';
import SummaryList from '@/pages/SummaryList';
import MemberList from '@/pages/MemberList';
import Profile from '@/pages/Profile';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/overview" element={<Overview />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/task-breakdown" element={<TaskBreakdown />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/task-logs" element={<TaskLogList />} />
        <Route path="/summaries" element={<SummaryList />} />
        <Route path="/members" element={<MemberList />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
