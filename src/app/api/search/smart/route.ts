import { NextRequest, NextResponse } from 'next/server';
import { SmartSearchEngine, SmartSearchQuery } from '@/lib/smart-search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query is required and must be a string'
      }, { status: 400 });
    }

    console.log(`Smart search query: "${query}"`);

    const searchEngine = new SmartSearchEngine();
    const searchQuery: SmartSearchQuery = {
      query,
      context: context || {}
    };

    const results = await searchEngine.search(searchQuery);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Smart search error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({
      success: false,
      error: 'Query parameter "q" is required'
    }, { status: 400 });
  }

  try {
    console.log(`Smart search GET query: "${query}"`);

    const searchEngine = new SmartSearchEngine();
    const searchQuery: SmartSearchQuery = {
      query,
      context: {}
    };

    const results = await searchEngine.search(searchQuery);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Smart search error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    }, { status: 500 });
  }
}
