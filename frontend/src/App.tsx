import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom';
import { Toaster } from 'sonner';
import { getAuthUser } from '@/hooks/useAuth';
import Login from '@/pages/login';
import Layout from '@/components/layout/Layout';
import Overview from '@/pages/Overview';
import ProjectList from '@/pages/ProjectList';
import TaskBreakdown from '@/pages/TaskBreakdown';
import TaskList from '@/pages/TaskList';
import TaskLogList from '@/pages/TaskLogList';
import SummaryList from '@/pages/SummaryList';
import MemberList from '@/pages/MemberList';
import Profile from '@/pages/Profile';

/** 全局鉴权：未登录重定向到 /login */
function authLoader() {
  const user = getAuthUser();
  if (!user) return redirect('/login');
  return null;
}

/** 路由表静态生成，只执行一次 */
const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <Layout />,
    loader: authLoader,
    children: [
      { path: 'overview', element: <Overview /> },
      { path: 'projects', element: <ProjectList /> },
      { path: 'task-breakdown', element: <TaskBreakdown /> },
      { path: 'tasks', element: <TaskList /> },
      { path: 'task-logs', element: <TaskLogList /> },
      { path: 'summaries', element: <SummaryList /> },
      { path: 'members', element: <MemberList /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
  {
    path: '*',
    loader: async () => redirect('/overview'),
  },
]);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}
