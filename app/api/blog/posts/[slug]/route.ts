import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostsCollection } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en'; // Default to 'en' for backward compatibility
    
    const collection = await getBlogPostsCollection();

    // First try to find post with exact slug and matching locale
    let query: any = {
      slug,
      status: 'published',
      $or: [
        { locale: locale },
        { locale: { $exists: false } }, // Include old posts without locale for backward compatibility
      ],
    };

    let post = await collection.findOne(query);

    // If not found and locale is specified, try to find by locale only (in case slug differs)
    // This handles cases where English and Swedish versions have different slugs
    if (!post && locale) {
      query = {
        status: 'published',
        locale: locale,
      };
      // Try to find a post with similar title or content (fallback)
      // For now, just return 404 if exact match not found
      // In future, we could implement slug translation mapping
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count
    await collection.updateOne({ _id: post._id }, { $inc: { views: 1 } });

    return NextResponse.json({
      success: true,
      post: JSON.parse(JSON.stringify(post)),
    });
  } catch (error) {
    console.error('Get blog post API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}
