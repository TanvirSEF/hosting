import { getCurrentAdmin } from '@/actions/admin-auth';
import { redirect } from 'next/navigation';
import { AdminBlogClientWrapper } from '@/components/admin/blog/AdminBlogClientWrapper';

export default async function AdminBlogPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  return <AdminBlogClientWrapper admin={admin} />;
}
