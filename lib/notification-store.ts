import { getNotificationReadsCollection } from './db';
import { NotificationRead } from './mongodb';

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
    userId: string | number,
    notificationId: string,
    mode: 'client' | 'admin'
): Promise<boolean> {
    try {
        const collection = await getNotificationReadsCollection();

        await collection.updateOne(
            { userId: String(userId), notificationId, mode },
            {
                $set: {
                    userId: String(userId),
                    notificationId,
                    readAt: new Date(),
                    mode,
                },
            },
            { upsert: true }
        );

        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
    userId: string | number,
    notificationIds: string[],
    mode: 'client' | 'admin'
): Promise<boolean> {
    try {
        console.log(`Marking ${notificationIds.length} notifications as read for user ${userId} (${mode})`);

        const collection = await getNotificationReadsCollection();

        if (notificationIds.length === 0) {
            console.log('No notification IDs to mark as read');
            return true;
        }

        const operations = notificationIds.map((notificationId) => ({
            updateOne: {
                filter: { userId: String(userId), notificationId, mode },
                update: {
                    $set: {
                        userId: String(userId),
                        notificationId,
                        readAt: new Date(),
                        mode,
                    },
                },
                upsert: true,
            },
        }));

        console.log(`Executing bulk write with ${operations.length} operations`);
        const result = await collection.bulkWrite(operations);
        console.log('Bulk write result:', {
            insertedCount: result.insertedCount,
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
        });

        return true;
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            name: error?.name,
        });
        return false;
    }
}

/**
 * Get read notification IDs for a user
 */
export async function getReadNotificationIds(
    userId: string | number,
    mode: 'client' | 'admin'
): Promise<string[]> {
    try {
        const collection = await getNotificationReadsCollection();

        const reads = await collection
            .find({ userId: String(userId), mode })
            .toArray();

        return reads.map((read) => read.notificationId);
    } catch (error) {
        console.error('Error fetching read notifications:', error);
        return [];
    }
}

/**
 * Check if a notification is read
 */
export async function isNotificationRead(
    userId: string | number,
    notificationId: string,
    mode: 'client' | 'admin'
): Promise<boolean> {
    try {
        const collection = await getNotificationReadsCollection();

        const read = await collection.findOne({
            userId: String(userId),
            notificationId,
            mode,
        });

        return !!read;
    } catch (error) {
        console.error('Error checking if notification is read:', error);
        return false;
    }
}
