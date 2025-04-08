import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plant = searchParams.get('plant');

  if (!plant) {
    return NextResponse.json({ error: 'Plant name is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?` +
      `key=${process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_API_KEY}` +
      `&cx=${process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_CX}` +
      `&q=${encodeURIComponent(plant + ' plant')}` +
      `&searchType=image` +
      `&num=4`
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch images');
    }

    const images = data.items?.map((item: any) => item.link) || [];
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 