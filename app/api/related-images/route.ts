import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameter
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    
    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: 'Query parameter is required and must be at least 3 characters' },
        { status: 400 }
      );
    }
    
    // Use Google Custom Search API
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cx = process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_CX;
    
    if (!apiKey || !cx) {
      console.error('Google Custom Search API key or CX ID is missing');
      return NextResponse.json(
        { error: 'Search API is not properly configured' },
        { status: 500 }
      );
    }
    
    // Build the Google Custom Search API URL
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=8&imgSize=medium&safe=active`;
    
    console.log(`Searching for images related to: ${query}`);
    
    // Make the request to Google Custom Search API
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Google API responded with ${response.status}: ${await response.text()}`);
    }
    
    const searchData = await response.json();
    
    // Extract image URLs from the response
    if (!searchData.items || !Array.isArray(searchData.items)) {
      return NextResponse.json({ images: [] });
    }
    
    const images = searchData.items.map((item: any) => ({
      src: item.link,
      title: item.title || '',
      thumbnail: item.image?.thumbnailLink || item.link,
      context: item.image?.contextLink || '',
      width: item.image?.width || 0,
      height: item.image?.height || 0
    }));
    
    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('Error fetching related images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related images: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 