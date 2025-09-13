'use client'

import { useEffect, useState, Suspense } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { Report, Pagination } from '@/lib/types'
import { ReportFilters } from '@/components/ReportFilters'
import { useRouter, useSearchParams } from 'next/navigation'
import { ReportCard } from '@/components/ReportCard'
import { ReportCardSkeleton } from '@/components/ReportCardSkeleton'
import { Pagination as PaginationControl } from '@/components/Pagination'
import Header from '@/components/Header'

function ReportBrowser() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reports, setReports] = useState<Report[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError(null)
      try {
        const query = searchParams.toString()
        const response = await fetch(`/api/reports?${query}`)
        if (!response.ok)
          throw new Error(`Failed to fetch: ${response.statusText}`)
        const data = await response.json()
        setReports(data.data)
        setPagination(data.pagination)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [searchParams])

  const handleFilterChange = () => {
    // This function is now primarily to re-trigger fetches when filters change.
    // The ReportFilters component handles the URL updates.
  }

  const handleTagClick = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(filterType, value)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <main className='container mx-auto p-4 max-w-6xl'>
      <Header />

      <ReportFilters onFilterChange={handleFilterChange} />

      <div className='my-4 pl-2 text-sm text-muted-foreground'>
        {loading ? (
          <p className='flex items-center'>
            共找到&nbsp;
            <span className='inline-block bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse h-5 w-8'></span>
            &nbsp;份研报
          </p>
        ) : pagination && pagination.totalItems > 0 ? (
          <p>
            共找到 <span className='font-bold'>{pagination.totalItems}</span>{' '}
            份研报
          </p>
        ) : null}
      </div>

      {error && (
        <Alert variant='destructive' className='my-4'>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>发生错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div>
          <ReportCardSkeleton />
          <ReportCardSkeleton />
          <ReportCardSkeleton />
        </div>
      ) : (
        <div>
          {reports.length > 0 &&
            reports.map((report) => (
              <ReportCard
                key={report.infoCode}
                report={report}
                onTagClick={handleTagClick}
              />
            ))}
          {!loading && reports.length === 0 && (
            <div className='h-24 text-center flex items-center justify-center'>
              <p>没有找到结果。</p>
            </div>
          )}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <PaginationControl
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </main>
  )
}

export default function ReportBrowserPage() {
  return (
    <Suspense
      fallback={
        <div className='container mx-auto p-4 max-w-6xl'>
          <Header />
          <div className='my-4 pl-2 text-sm text-muted-foreground'>
            <p className='flex items-center'>
              共找到&nbsp;
              <span className='inline-block bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse h-5 w-8'></span>
              &nbsp;份研报
            </p>
          </div>
          <div>
            <ReportCardSkeleton />
            <ReportCardSkeleton />
            <ReportCardSkeleton />
          </div>
        </div>
      }
    >
      <ReportBrowser />
    </Suspense>
  )
}
