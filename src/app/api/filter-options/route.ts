import { NextResponse } from 'next/server'

export const runtime = 'edge'
export async function GET() {
  // Ensure NEXT_PUBLIC_APP_URL is set in your environment variables
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    // We fetch from our own internal API route.
    // This allows us to leverage Next.js's fetch caching mechanism.
    const response = await fetch(`${appUrl}/api/internal/filter-options`, {
      next: {
        revalidate: 86400, // Cache for one day (24 * 60 * 60 seconds)
        tags: ['filter-options'], // Tag for on-demand revalidation
      },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch internal filter options: ${response.statusText}`,
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch cached filter options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 },
    )
  }
}
