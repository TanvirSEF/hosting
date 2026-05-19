'use server';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getAdminUsersCollection } from '@/lib/db';
import { AdminRole } from '@/lib/mongodb';

const ADMIN_JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function adminLoginAction(prevState: any, formData: FormData) {
  const result = adminLoginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { email, password } = result.data;

  try {
    // Find admin user in MongoDB
    const collection = await getAdminUsersCollection();
    const user = await collection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return { error: 'Invalid credentials' };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { error: 'Invalid credentials' };
    }

    // Generate JWT with role
    const token = await new SignJWT({
      userId: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(ADMIN_JWT_SECRET);

    // Set cookie
    (await cookies()).set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Revalidate all admin dashboard cache to show fresh data after login
    revalidatePath('/spike/dashboard', 'page');
    revalidatePath('/spike/clients', 'page');
    revalidatePath('/spike/services', 'page');
    revalidatePath('/spike/domains', 'page');
    revalidatePath('/spike/billing', 'page');
    revalidatePath('/spike/support', 'page');
    revalidatePath('/spike/staff', 'page');
  } catch (error) {
    console.error('Admin login error:', error);
    return { error: 'Authentication failed' };
  }

  redirect('/spike/dashboard');
}

export async function adminLogoutAction() {
  (await cookies()).delete('admin_session');
  redirect('/spike/login');
}

// Get current admin user from session
export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    return {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}
