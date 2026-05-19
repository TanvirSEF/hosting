import { NextResponse } from 'next/server';
import { getBlogCategoriesCollection } from '@/lib/db';

export async function GET() {
  try {
    const collection = await getBlogCategoriesCollection();

    const categories = await collection.find().sort({ order: 1 }).toArray();

    // Filter out 'guide' category as requested
    const filteredCategories = categories.filter(cat =>
      !cat.slug.toLowerCase().includes('guide') &&
      !cat.name.toLowerCase().includes('guide')
    );

    return NextResponse.json({
      success: true,
      categories: JSON.parse(JSON.stringify(filteredCategories)),
    });
  } catch (error) {
    console.error('Get categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
