'use server';

import { whmcsApi } from '@/lib/whmcs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getClientsCollection } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const registerSchema = z
  .object({
    firstname: z.string().min(2, 'First name must be at least 2 characters'),
    lastname: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    phonenumber: z.string().optional(),
    address1: z.string().min(4, 'Address line 1 is required'),
    address2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province/Region is required'),
    postcode: z.string().min(3, 'Postcode/ZIP is required'),
    country: z.string().length(2, 'Country must be 2-letter ISO code (e.g. PK, US, ES)'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export async function registerUserAction(prevState: any, formData: FormData) {
  try {
    // 1. Parse & validate form data
    const raw = Object.fromEntries(formData);
    const parsed = registerSchema.safeParse(raw);

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Validation failed' };
    }

    const {
      firstname,
      lastname,
      email,
      password,
      phonenumber,
      address1,
      address2,
      city,
      state,
      postcode,
      country,
    } = parsed.data;

    const emailLower = email.toLowerCase().trim();

    // 2. Prevent duplicate in MongoDB
    const collection = await getClientsCollection();
    if (await collection.findOne({ email: emailLower })) {
      return { error: 'An account with this email already exists.' };
    }

    // 3. Create client in WHMCS — real address data
    const whmcsResponse = await whmcsApi('AddClient', {
      firstname,
      lastname,
      email: emailLower,
      password2: password,
      address1,
      address2: address2 || '',
      city,
      state,
      postcode,
      country,
      phonenumber: phonenumber || '',
      status: 'Active',
      clientip: '127.0.0.1',
      noemail: 0,
      skipvalidation: false,
    });

    if (whmcsResponse.result !== 'success') {
      return {
        error: whmcsResponse.message || 'WHMCS account creation failed',
      };
    }

    const whmcsClientId = Number(whmcsResponse.clientid);

    // 4. Store in MongoDB
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    const insertResult = await collection.insertOne({
      whmcsId: whmcsClientId,
      email: emailLower,
      password: hashedPassword,
      firstname,
      lastname,
      phonenumber: phonenumber || undefined,
      address1,
      address2: address2 || undefined,
      city,
      state,
      postcode,
      country,
      status: 'Active',
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: now,
    });

    // 5. Create session (JWT)
    const token = await new SignJWT({
      mongoId: insertResult.insertedId.toString(),
      userId: whmcsClientId,
      email: emailLower,
      name: `${firstname} ${lastname}`,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    (await cookies()).set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    // 6. Welcome email – disabled
    // try {
    //   await sendWelcomeEmail(emailLower, firstname);
    //   console.log(`Welcome email queued for: ${emailLower}`);
    // } catch (err) {
    //   console.error('Welcome email failed (non-critical):', err);
    // }

    return {
      success: true,
      userId: whmcsClientId,
      message: 'Account created successfully!',
    };
  } catch (err: any) {
    console.error('Registration failed:', err);

    if (err?.message?.includes('duplicate key')) {
      return { error: 'Email already registered.' };
    }

    return {
      error: err.message || 'Server error during registration. Please try again.',
    };
  }
}

export async function checkEmailAvailability(email: string) {
  try {
    const collection = await getClientsCollection();
    return {
      available: !(await collection.findOne({ email: email.toLowerCase().trim() })),
    };
  } catch {
    return { available: true }; // fail open
  }
}
