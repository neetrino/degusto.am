import { requireAdminAppAccess } from '@/lib/auth/require-admin-app-access';
import { AdminMobileLayoutClient } from './AdminMobileLayoutClient';

export default async function AdminMobileLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAppAccess('/admin-mobile');
  return <AdminMobileLayoutClient>{children}</AdminMobileLayoutClient>;
}
