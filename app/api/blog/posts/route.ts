import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostsCollection, getBlogCategoriesCollection } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const locale = searchParams.get('locale') || 'en'; // Default to 'en' for backward compatibility
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    const collection = await getBlogPostsCollection();

    const query: any = { status: 'published' };

    if (category) {
      query.category = category;
    }

    // Filter by locale - include posts with matching locale or no locale (for backward compatibility)
    query.$or = [
      { locale: locale },
      { locale: { $exists: false } }, // Include old posts without locale field
    ];

    const [posts, total] = await Promise.all([
      collection
        .find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      posts: JSON.parse(JSON.stringify(posts)),
      total,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error('Get blog posts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
