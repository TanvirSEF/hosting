'use server';

import { getBlogPostsCollection, getBlogCategoriesCollection } from '@/lib/db';
import { BlogPost, BlogCategory } from '@/lib/mongodb';
import { uploadToR2, deleteFromR2, extractR2Key } from '@/lib/r2';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';

const ADMIN_JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

// Get current admin user
async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session')?.value;

  if (!adminSession) {
    throw new Error('Unauthorized');
  }

  try {
    const { payload } = await jwtVerify(adminSession, ADMIN_JWT_SECRET);
    return payload as { id: string; email: string; name: string; role: string };
  } catch {
    throw new Error('Invalid session');
  }
}

// Generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ==================== BLOG POSTS ====================

/**
 * Create new blog post
 */
export async function createBlogPost(formData: FormData) {
  try {
    const admin = await getCurrentAdmin();
    const collection = await getBlogPostsCollection();

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const excerpt = formData.get('excerpt') as string;
    const category = formData.get('category') as string;
    const locale = (formData.get('locale') as string) || 'en';
    const tags =
      (formData.get('tags') as string)
        ?.split(',')
        .map((t) => t.trim())
        .filter(Boolean) || [];
    const status = formData.get('status') as 'draft' | 'published';
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;

    if (!title || !content || !excerpt || !category) {
      return { error: 'Missing required fields' };
    }

    // Generate unique slug
    let slug = generateSlug(title);
    const existingPost = await collection.findOne({ slug });
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    // Handle featured image upload
    const featuredImageFile = formData.get('featuredImage') as File | null;
    let featuredImage: BlogPost['featuredImage'] = undefined;

    if (featuredImageFile && featuredImageFile.size > 0) {
      const uploadResult = await uploadToR2(featuredImageFile, 'blog/featured');
      featuredImage = {
        url: uploadResult.url,
        alt: title,
        width: uploadResult.width,
        height: uploadResult.height,
      };
    }

    const now = new Date();
    const post: BlogPost = {
      title,
      slug,
      content,
      excerpt,
      locale,
      featuredImage,
      category,
      tags,
      author: {
        id: new ObjectId(admin.id),
        name: admin.name,
      },
      status,
      publishedAt: status === 'published' ? now : undefined,
      views: 0,
      seo: {
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(post);

    // Update category post count
    if (status === 'published') {
      const categoriesCollection = await getBlogCategoriesCollection();
      await categoriesCollection.updateOne(
        { slug: category },
        { $inc: { postCount: 1 } }
      );
    }

    revalidatePath('/spike/blog');
    revalidatePath('/[locale]/blog', 'page');

    return { success: true, postId: result.insertedId.toString(), slug };
  } catch (error: any) {
    console.error('Create blog post error:', error);
    return { error: error.message || 'Failed to create blog post' };
  }
}

/**
 * Update existing blog post
 */
export async function updateBlogPost(postId: string, formData: FormData) {
  try {
    const admin = await getCurrentAdmin();
    const collection = await getBlogPostsCollection();

    const post = await collection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return { error: 'Post not found' };
    }

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const excerpt = formData.get('excerpt') as string;
    const category = formData.get('category') as string;
    const locale = (formData.get('locale') as string) || 'en';
    const tags =
      (formData.get('tags') as string)
        ?.split(',')
        .map((t) => t.trim())
        .filter(Boolean) || [];
    const status = formData.get('status') as 'draft' | 'published';
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;

    if (!title || !content || !excerpt || !category) {
      return { error: 'Missing required fields' };
    }

    // Handle slug change
    let slug = post.slug;
    if (title !== post.title) {
      slug = generateSlug(title);
      const existingPost = await collection.findOne({
        slug,
        _id: { $ne: new ObjectId(postId) },
      });
      if (existingPost) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Handle featured image upload/removal
    const featuredImageFile = formData.get('featuredImage') as File | null;
    const shouldRemoveImage = formData.get('removeImage') === 'true';
    let featuredImage = post.featuredImage;

    if (featuredImageFile && featuredImageFile.size > 0) {
      // Delete old image if exists
      if (post.featuredImage?.url) {
        const oldKey = extractR2Key(post.featuredImage.url);
        if (oldKey) {
          await deleteFromR2(oldKey).catch(console.error);
        }
      }

      // Upload new image
      const uploadResult = await uploadToR2(featuredImageFile, 'blog/featured');
      featuredImage = {
        url: uploadResult.url,
        alt: title,
        width: uploadResult.width,
        height: uploadResult.height,
      };
    } else if (shouldRemoveImage && post.featuredImage?.url) {
      // Delete the image if removal is requested
      const oldKey = extractR2Key(post.featuredImage.url);
      if (oldKey) {
        await deleteFromR2(oldKey).catch(console.error);
      }
      featuredImage = undefined;
    }

    const updateData: Partial<BlogPost> = {
      title,
      slug,
      content,
      excerpt,
      locale,
      featuredImage,
      category,
      tags,
      status,
      publishedAt:
        status === 'published' && !post.publishedAt
          ? new Date()
          : post.publishedAt,
      seo: {
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
      },
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(postId) },
      { $set: updateData }
    );

    // Update category post counts if category or status changed
    if (category !== post.category || status !== post.status) {
      const categoriesCollection = await getBlogCategoriesCollection();

      // Decrement old category if was published
      if (post.status === 'published') {
        await categoriesCollection.updateOne(
          { slug: post.category },
          { $inc: { postCount: -1 } }
        );
      }

      // Increment new category if now published
      if (status === 'published') {
        await categoriesCollection.updateOne(
          { slug: category },
          { $inc: { postCount: 1 } }
        );
      }
    }

    revalidatePath('/spike/blog');
    revalidatePath('/[locale]/blog', 'page');
    revalidatePath(`/[locale]/blog/${slug}`, 'page');

    return { success: true, slug };
  } catch (error: any) {
    console.error('Update blog post error:', error);
    return { error: error.message || 'Failed to update blog post' };
  }
}

/**
 * Delete blog post
 */
export async function deleteBlogPost(postId: string) {
  try {
    await getCurrentAdmin();
    const collection = await getBlogPostsCollection();

    const post = await collection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return { error: 'Post not found' };
    }

    // Delete featured image from R2
    if (post.featuredImage?.url) {
      const key = extractR2Key(post.featuredImage.url);
      if (key) {
        await deleteFromR2(key).catch(console.error);
      }
    }

    // Delete post
    await collection.deleteOne({ _id: new ObjectId(postId) });

    // Update category post count
    if (post.status === 'published') {
      const categoriesCollection = await getBlogCategoriesCollection();
      await categoriesCollection.updateOne(
        { slug: post.category },
        { $inc: { postCount: -1 } }
      );
    }

    revalidatePath('/spike/blog');
    revalidatePath('/[locale]/blog', 'page');

    return { success: true };
  } catch (error: any) {
    console.error('Delete blog post error:', error);
    return { error: error.message || 'Failed to delete blog post' };
  }
}

/**
 * Get all blog posts (admin)
 */
export async function getBlogPosts(filters?: {
  status?: 'draft' | 'published';
  category?: string;
  locale?: string;
  search?: string;
}) {
  try {
    await getCurrentAdmin();
    const collection = await getBlogPostsCollection();

    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.locale) {
      query.locale = filters.locale;
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { excerpt: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const posts = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return { success: true, posts: JSON.parse(JSON.stringify(posts)) };
  } catch (error: any) {
    console.error('Get blog posts error:', error);
    return { error: error.message || 'Failed to fetch blog posts' };
  }
}

/**
 * Get single blog post by ID (admin)
 */
export async function getBlogPostById(postId: string) {
  try {
    await getCurrentAdmin();
    const collection = await getBlogPostsCollection();

    const post = await collection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return { error: 'Post not found' };
    }

    return { success: true, post: JSON.parse(JSON.stringify(post)) };
  } catch (error: any) {
    console.error('Get blog post error:', error);
    return { error: error.message || 'Failed to fetch blog post' };
  }
}

// ==================== BLOG CATEGORIES ====================

/**
 * Create new category
 */
export async function createBlogCategory(data: {
  name: string;
  description?: string;
  icon?: string;
}) {
  try {
    await getCurrentAdmin();
    const collection = await getBlogCategoriesCollection();

    const slug = generateSlug(data.name);

    // Check if category exists
    const existing = await collection.findOne({ slug });
    if (existing) {
      return { error: 'Category already exists' };
    }

    // Get max order
    const maxOrderCategory = await collection
      .find()
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const order =
      maxOrderCategory.length > 0 ? maxOrderCategory[0].order + 1 : 0;

    const category: BlogCategory = {
      name: data.name,
      slug,
      description: data.description,
      icon: data.icon,
      order,
      postCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(category);

    revalidatePath('/spike/blog');
    revalidatePath('/[locale]/blog', 'page');

    return { success: true, categoryId: result.insertedId.toString() };
  } catch (error: any) {
    console.error('Create category error:', error);
    return { error: error.message || 'Failed to create category' };
  }
}

/**
 * Get all categories
 */
export async function getBlogCategories() {
  try {
    const collection = await getBlogCategoriesCollection();

    const categories = await collection.find().sort({ order: 1 }).toArray();

    return {
      success: true,
      categories: JSON.parse(JSON.stringify(categories)),
    };
  } catch (error: any) {
    console.error('Get categories error:', error);
    return { error: error.message || 'Failed to fetch categories' };
  }
}

/**
 * Upload image to R2 (for editor)
 */
export async function uploadBlogImage(formData: FormData) {
  try {
    await getCurrentAdmin();

    const file = formData.get('image') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    const result = await uploadToR2(file, 'blog/content');

    return { success: true, url: result.url };
  } catch (error: any) {
    console.error('Upload image error:', error);
    return { error: error.message || 'Failed to upload image' };
  }
}
