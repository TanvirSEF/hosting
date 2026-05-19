'use server';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import {
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '@/lib/notification-store';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId() {
    const cookieStore = cookies();
    const session = (await cookieStore).get('session')?.value;
    if (!session) return null;
    try {
        const { payload } = await jwtVerify(session, JWT_SECRET);
        return payload.userId as string | number;
    } catch {
        return null;
    }
}

async function isAdmin() {
    const cookieStore = cookies();
    return !!(await cookieStore).get('admin_session')?.value;
}

/**
 * Mark a single notification as read
 */
export async function markAsReadAction(
    notificationId: string,
    mode: 'client' | 'admin'
): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        // For admin mode, verify admin session
        if (mode === 'admin') {
            const adminCheck = await isAdmin();
            if (!adminCheck) {
                return { success: false, error: 'Not authorized' };
            }
        }

        const success = await markNotificationAsRead(userId, notificationId, mode);

        if (!success) {
            return { success: false, error: 'Failed to mark notification as read' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error in markAsReadAction:', error);
        return { success: false, error: 'An error occurred' };
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsReadAction(
    notificationIds: string[],
    mode: 'client' | 'admin'
): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getUserId();
        if (!userId) {
            console.error('markAllAsReadAction: User not authenticated');
            return { success: false, error: 'Not authenticated' };
        }

        console.log(`markAllAsReadAction: Marking ${notificationIds.length} notifications for user ${userId} in ${mode} mode`);

        // For admin mode, verify admin session
        if (mode === 'admin') {
            const adminCheck = await isAdmin();
            if (!adminCheck) {
                console.error('markAllAsReadAction: User not authorized as admin');
                return { success: false, error: 'Not authorized' };
            }
        }

        const success = await markAllNotificationsAsRead(
            userId,
            notificationIds,
            mode
        );

        if (!success) {
            console.error('markAllAsReadAction: markAllNotificationsAsRead returned false');
            return { success: false, error: 'Failed to mark all notifications as read' };
        }

        console.log('markAllAsReadAction: Successfully marked all as read');
        return { success: true };
    } catch (error: any) {
        console.error('Error in markAllAsReadAction:', error);
        console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
        });
        return { success: false, error: error?.message || 'An error occurred' };
    }
}
