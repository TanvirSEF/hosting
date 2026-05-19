import { getCurrentAdmin } from '@/actions/admin-auth';
import { redirect } from 'next/navigation';
import { EditBlogPostClientWrapper } from '@/components/admin/blog/EditBlogPostClientWrapper';

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  const { id } = await params;
  return <EditBlogPostClientWrapper admin={admin} postId={id} />;
}
