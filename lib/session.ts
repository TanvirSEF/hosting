import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface UserSession {
    userId: string | number;
    email: string;
    name?: string;
    mongoId?: string;
    role?: string;
}

/**
 * Get current user from JWT session
 */
export async function getCurrentUser(): Promise<UserSession | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie) {
            return null;
        }

        const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
        return payload as unknown as UserSession;
    } catch (error) {
        return null;
    }
}
