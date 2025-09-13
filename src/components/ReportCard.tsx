'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye } from 'lucide-react'
import { Report } from '@/lib/types'
import { Button } from '@/components/ui/button'
import columnCodes from '@/lib/column-codes.json'

interface ReportCardProps {
  report: Report
  onTagClick: (
    filterType:
      | 'orgCode'
      | 'author'
      | 'industryCode'
      | 'stockCode'
      | 'reportType'
      | 'columnCode',
    value: string,
  ) => void
}

export const ReportCard = ({ report, onTagClick }: ReportCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [authorsExpanded, setAuthorsExpanded] = useState(false)
  const searchParams = useSearchParams()
  const contentQuery = searchParams.get('contentQuery')

  const highlightKeywords = (
    htmlContent: string,
    query: string | null,
  ): string => {
    if (!query || !htmlContent) {
      return htmlContent
    }

    const keywords = query.split(' ').filter((kw) => kw.trim() !== '')
    if (keywords.length === 0) {
      return htmlContent
    }

    // This regex finds keywords outside of HTML tags.
    // It's a simplified approach and might not cover all edge cases.
    const regex = new RegExp(`(${keywords.join('|')})(?![^<]*>)`, 'gi')

    return htmlContent.replace(regex, (match) => `<mark>${match}</mark>`)
  }

  const handleTagClick = (
    e: React.MouseEvent,
    filterType:
      | 'orgCode'
      | 'author'
      | 'industryCode'
      | 'stockCode'
      | 'reportType'
      | 'columnCode',
    value: string | null,
  ) => {
    e.stopPropagation() // Prevent card from expanding when a tag is clicked
    if (value) {
      onTagClick(filterType, value)
    }
  }

  // Handle both industry and individual industry fields
  const industryDisplayCode = report.industryCode || report.indvInduCode
  const industryDisplayName = report.industryName || report.indvInduName

  const marketCode = report.market === 'SHANGHAI' ? 1 : 0

  const columnLabel = columnCodes.find((c) => c.value === report.column)?.label

  return (
    <div
      className='p-4 border rounded-lg bg-card mb-4 cursor-pointer transition-all duration-300 ease-in-out'
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className='flex justify-between items-start'>
        <h2 className='text-xl font-bold pr-4'>
          {report.title}
          {report.attachPages && (
            <span className='text-sm font-normal text-muted-foreground ml-2'>
              [ {report.attachPages}页 ]
            </span>
          )}
        </h2>
        <p className='text-sm text-muted-foreground whitespace-nowrap'>
          {report.publishDate
            ? new Date(report.publishDate).toLocaleDateString()
            : 'N/A'}
        </p>
      </div>

      <div className='flex flex-wrap gap-x-4 gap-y-2 mt-2 items-center'>
        {report.reportType && (
          <button
            onClick={(e) => handleTagClick(e, 'reportType', report.reportType)}
            className='text-sm bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1 rounded-md dark:bg-green-900 dark:text-green-300'
          >
            {report.reportType === '2' ? '个股研报' : '行业研报'}
          </button>
        )}
        {report.stockCode && report.stockName && (
          <button
            onClick={(e) => handleTagClick(e, 'stockCode', report.stockCode)}
            className='text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 px-2 py-1 rounded-md dark:bg-blue-900 dark:text-blue-300'
          >
            {report.stockName} ({report.stockCode})
          </button>
        )}
        {report.column && columnLabel && (
          <button
            onClick={(e) => handleTagClick(e, 'columnCode', report.column)}
            className='text-sm bg-purple-100 text-purple-800 hover:bg-purple-200 px-2 py-1 rounded-md dark:bg-purple-900 dark:text-purple-300'
          >
            {columnLabel}
          </button>
        )}
        {industryDisplayCode && industryDisplayName && (
          <button
            onClick={(e) =>
              handleTagClick(e, 'industryCode', industryDisplayCode)
            }
            className='text-sm bg-muted hover:bg-muted/80 px-2 py-1 rounded-md'
          >
            {industryDisplayName}
          </button>
        )}
        {report.orgCode && report.orgSName && (
          <button
            onClick={(e) => handleTagClick(e, 'orgCode', report.orgCode)}
            className='text-sm bg-muted hover:bg-muted/80 px-2 py-1 rounded-md'
          >
            {report.orgSName}
          </button>
        )}
        {report.authorNames.length > 1 && !authorsExpanded ? (
          <>
            <button
              onClick={(e) => handleTagClick(e, 'author', report.authors[0])}
              className='text-sm bg-muted hover:bg-muted/80 px-2 py-1 rounded-md'
            >
              {report.authorNames[0]}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setAuthorsExpanded(true)
              }}
              className='text-sm bg-muted hover:bg-muted/80 px-2 py-1 rounded-md'
            >
              ...
            </button>
          </>
        ) : (
          report.authorNames.map((name, index) => (
            <button
              key={index}
              onClick={(e) =>
                handleTagClick(e, 'author', report.authors[index])
              }
              className='text-sm bg-muted hover:bg-muted/80 px-2 py-1 rounded-md'
            >
              {name}
            </button>
          ))
        )}
      </div>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-0' : 'max-h-[200px] mt-3'}`}
      >
        <p>{report.summary}</p>
      </div>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[10000px] mt-4' : 'max-h-0'}`}
      >
        {isExpanded && report.stockCode && (
          <div className='my-4 flex justify-center'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`K图 ${report.stockCode}`}
              className='rounded-sm shadow-sm border border-gray-200 dark:border-gray-700'
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
              }}
              src={`https://webquoteklinepic.eastmoney.com/GetPic.aspx?nid=${marketCode}.${report.stockCode}&imageType=k`}
            />
          </div>
        )}
        <div
          className='prose max-w-none dark:prose-invert'
          dangerouslySetInnerHTML={{
            __html: highlightKeywords(report.content || '', contentQuery),
          }}
        />
      </div>

      <div className='flex justify-end mt-1'>
        {report.pdfLink && (
          <Button
            asChild
            size='sm'
            variant='outline'
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={report.pdfLink}
              target='_blank'
              rel='noopener noreferrer'
              download
            >
              <Eye className='h-4 w-4' />
              阅读{' '}
              {report.attachSize
                ? `(${(report.attachSize / 1024).toFixed(2)} MB)`
                : ''}
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
