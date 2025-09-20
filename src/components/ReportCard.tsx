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

interface TagProps {
  onClick: (e: React.MouseEvent) => void
  className?: string
  children: React.ReactNode
}

const Tag = ({ onClick, className, children }: TagProps) => (
  <button
    onClick={onClick}
    className={`text-sm px-2 py-1 rounded-md ${className}`}
  >
    {children}
  </button>
)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}/${month}/${day}`
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

  const formatAuthorName = (name: string) => {
    const parts = name.split('.')
    return parts.length > 1 ? parts.slice(1).join('.') : name
  }

  return (
    <div
      className='p-4 border rounded-lg bg-card mb-4 cursor-pointer transition-all duration-300 ease-in-out'
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className='flex justify-between items-start'>
        <h2 className='text-xl font-bold pr-4'>
          <span
            dangerouslySetInnerHTML={{
              __html: highlightKeywords(report.title || '', contentQuery),
            }}
          />
          {report.attachPages && (
            <span className='text-sm font-normal text-muted-foreground ml-2'>
              [ {report.attachPages}页 ]
            </span>
          )}
        </h2>
        <p className='text-sm text-muted-foreground whitespace-nowrap'>
          {report.publishDate ? formatDate(report.publishDate) : 'N/A'}
        </p>
      </div>

      <div className='flex flex-wrap gap-x-2 gap-y-2 mt-2 items-center'>
        {report.reportType && (
          <Tag
            onClick={(e) => handleTagClick(e, 'reportType', report.reportType)}
            className='bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
          >
            {report.reportType === '2' ? '个股研报' : '行业研报'}
          </Tag>
        )}
        {report.stockCode && report.stockName && (
          <Tag
            onClick={(e) => handleTagClick(e, 'stockCode', report.stockCode)}
            className='bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
          >
            {report.stockName} ({report.stockCode})
          </Tag>
        )}
        {report.column && columnLabel && (
          <Tag
            onClick={(e) => handleTagClick(e, 'columnCode', report.column)}
            className='bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300'
          >
            {columnLabel}
          </Tag>
        )}
        {industryDisplayCode && industryDisplayName && (
          <Tag
            onClick={(e) =>
              handleTagClick(e, 'industryCode', industryDisplayCode)
            }
            className='bg-muted hover:bg-muted/80'
          >
            {industryDisplayName}
          </Tag>
        )}
        {report.orgCode && report.orgSName && (
          <Tag
            onClick={(e) => handleTagClick(e, 'orgCode', report.orgCode)}
            className='bg-muted hover:bg-muted/80'
          >
            {report.orgSName}
          </Tag>
        )}
        {report.authorNames.length > 1 && !authorsExpanded ? (
          <>
            <Tag
              onClick={(e) => handleTagClick(e, 'author', report.authors[0])}
              className='bg-muted hover:bg-muted/80'
            >
              {formatAuthorName(report.authorNames[0])}
            </Tag>
            <Tag
              onClick={(e) => {
                e.stopPropagation()
                setAuthorsExpanded(true)
              }}
              className='bg-muted hover:bg-muted/80'
            >
              ...
            </Tag>
          </>
        ) : (
          report.authorNames.map((name, index) => (
            <Tag
              key={index}
              onClick={(e) =>
                handleTagClick(e, 'author', report.authors[index])
              }
              className='bg-muted hover:bg-muted/80'
            >
              {formatAuthorName(name)}
            </Tag>
          ))
        )}
      </div>

      <div
        className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[0fr]' : 'grid-rows-[1fr] mt-3'}`}
      >
        <div className='overflow-hidden'>
          <div
            className='prose prose-sm max-w-none dark:prose-invert line-clamp-8'
            dangerouslySetInnerHTML={{
              __html: highlightKeywords(report.summary || '', contentQuery),
            }}
          />
        </div>
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

      <div className='flex justify-end mt-2'>
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
