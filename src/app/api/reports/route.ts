import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = new URL(request.url);

  try {
    // Forward the request to the internal API, preserving search parameters.
    // This leverages Next.js's fetch caching. The cache key is the full URL,
    // so different queries (e.g., different pages or filters) are cached separately.
    const response = await fetch(`${appUrl}/api/internal/reports${url.search}`, {
      next: {
        revalidate: 600, // Cache for 10 minutes
        tags: ['reports'], // Tag for on-demand revalidation
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch internal reports: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch cached reports:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}