import { MetadataRoute } from 'next'

const URL = process.env.NEXT_PUBLIC_APP_URL!

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
