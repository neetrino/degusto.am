import { requireAdminAppAccess } from '@/lib/auth/require-admin-app-access';
import { AdminLayoutClient } from './components/AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAppAccess('/supersudo');
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
