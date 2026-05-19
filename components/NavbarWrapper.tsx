import { getCurrentUser } from '@/actions/session';
import { getCurrentAdmin } from '@/actions/admin-auth';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  const user = await getCurrentUser();
  const admin = await getCurrentAdmin();

  return <NavbarClient user={user} admin={admin} />;
}
