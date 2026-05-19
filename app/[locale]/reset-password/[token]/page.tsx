import { ResetPasswordClient } from './ResetPasswordClient';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Await params (Next.js 15 requirement)
  const { token } = await params;

  return <ResetPasswordClient token={token} />;
}
