'use server';

import { getAdminUsersCollection, getSupportActionsCollection } from '@/lib/db';
import { AdminRole, AdminUser } from '@/lib/mongodb';
import { canAccess } from '@/lib/roles';
import { getCurrentAdmin } from './admin-auth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// Get all staff members
export async function getStaffListAction() {
  const admin = await getCurrentAdmin();
  if (!admin || !canAccess(admin.role, 'staff')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const collection = await getAdminUsersCollection();
    const staff = await collection.find({}).sort({ createdAt: -1 }).toArray();

    // Remove passwords from response and convert dates to strings
    const safeStaff = staff.map(({ password, ...rest }) => ({
      ...rest,
      _id: rest._id?.toString(),
      createdAt: rest.createdAt?.toISOString(),
      updatedAt: rest.updatedAt?.toISOString(),
    }));

    return { success: true, data: safeStaff };
  } catch (error) {
    return { success: false, error: 'Failed to fetch staff' };
  }
}

// Create new staff member
export async function createStaffAction(data: {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
}) {
  const admin = await getCurrentAdmin();
  if (!admin || !canAccess(admin.role, 'staff')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const collection = await getAdminUsersCollection();

    // Check if email exists
    const existing = await collection.findOne({
      email: data.email.toLowerCase(),
    });
    if (existing) {
      return { success: false, error: 'Email already exists' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = new Date();

    await collection.insertOne({
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath('/spike/staff', 'page');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to create staff' };
  }
}

// Update staff member
export async function updateStaffAction(
  id: string,
  data: {
    name?: string;
    email?: string;
    role?: AdminRole;
    password?: string;
  }
) {
  const admin = await getCurrentAdmin();
  if (!admin || !canAccess(admin.role, 'staff')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const collection = await getAdminUsersCollection();

    const updateData: any = { updatedAt: new Date() };
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.role) updateData.role = data.role;
    if (data.password)
      updateData.password = await bcrypt.hash(data.password, 10);

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    revalidatePath('/spike/staff', 'page');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update staff' };
  }
}

// Delete staff member
export async function deleteStaffAction(id: string) {
  const admin = await getCurrentAdmin();
  if (!admin || !canAccess(admin.role, 'staff')) {
    return { success: false, error: 'Unauthorized' };
  }

  // Prevent self-deletion
  if (admin.id === id) {
    return { success: false, error: 'Cannot delete yourself' };
  }

  try {
    const collection = await getAdminUsersCollection();
    await collection.deleteOne({ _id: new ObjectId(id) });

    revalidatePath('/spike/staff', 'page');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete staff' };
  }
}

// Log support action
export async function logSupportAction(
  action: string,
  ticketId?: number,
  details?: string
) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  try {
    const collection = await getSupportActionsCollection();
    await collection.insertOne({
      staffId: new ObjectId(admin.id),
      staffName: admin.name,
      action,
      ticketId,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
  }
}

// Get support action history
export async function getSupportActionsAction(limit: number = 50) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const collection = await getSupportActionsCollection();
    const actions = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return {
      success: true,
      data: actions.map((a) => ({
        ...a,
        _id: a._id?.toString(),
        staffId: a.staffId.toString(),
      })),
    };
  } catch (error) {
    return { success: false, error: 'Failed to fetch actions' };
  }
}
