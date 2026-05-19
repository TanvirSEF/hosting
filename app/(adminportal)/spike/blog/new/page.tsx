import { getCurrentAdmin } from '@/actions/admin-auth';
import { redirect } from 'next/navigation';
import { NewBlogPostClientWrapper } from '@/components/admin/blog/NewBlogPostClientWrapper';

export default async function NewBlogPostPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  return <NewBlogPostClientWrapper admin={admin} />;
}
