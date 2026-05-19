import { getCurrentAdmin } from '@/actions/admin-auth';
import { canAccess } from '@/lib/roles';
import { getStaffListAction } from '@/actions/admin-staff-actions';
import { redirect } from 'next/navigation';
import { AdminStaffClientWrapper } from '@/components/admin/AdminStaffClientWrapper';

async function getPageData() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  if (!canAccess(admin.role, 'staff')) {
    redirect('/spike/dashboard');
  }

  const result = await getStaffListAction();
  return {
    admin,
    staff: result.success ? result.data : [],
  };
}

export default async function StaffManagementPage() {
  const { admin, staff } = await getPageData();

  const superAdmins =
    staff?.filter((s: any) => s.role === 'SUPER_ADMIN').length || 0;
  const admins = staff?.filter((s: any) => s.role === 'ADMIN').length || 0;
  const moderators =
    staff?.filter((s: any) => s.role === 'MODERATOR').length || 0;

  return (
    <AdminStaffClientWrapper
      admin={admin}
      staff={staff || []}
      superAdmins={superAdmins}
      admins={admins}
      moderators={moderators}
      currentUserId={admin.id}
    />
  );
}
