'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import industryCodes from '@/lib/industry-codes.json'
import columnCodes from '@/lib/column-codes.json'

interface Stock {
  value: string
  label: string
}

interface Institution {
  value: string
  label: string
}

interface ActiveFiltersDisplayProps {
  stockList: Stock[]
  institutionList: Institution[]
  handleClearFilters: () => void
}

const FilterTag = ({ children }: { children: React.ReactNode }) => (
  <span className='bg-muted text-foreground rounded-sm px-1.5 py-0.5 text-xs'>
    {children}
  </span>
)

export const ActiveFiltersDisplay = ({
  stockList,
  institutionList,
  handleClearFilters,
}: ActiveFiltersDisplayProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeFilters: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'page' && key !== 'pageSize' && value) {
      activeFilters[key] = value
    }
  }

  const clearSingleFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.push(`?${params.toString()}`)
  }

  const hasActiveFilters = Object.keys(activeFilters).length > 0

  if (!hasActiveFilters) {
    return null
  }

  const getFilterDisplay = (key: string, value: string) => {
    const displayName: { [key: string]: string } = {
      reportType: '报表类型',
      industryCode: '行业',
      columnCode: '栏目',
      stockCode: '股票',
      orgCode: '机构',
      contentQuery: '关键词',
      attachPages: '页数',
      author: '作者',
    }

    const displayValue = ((key: string, val: string): React.ReactNode => {
      switch (key) {
        case 'reportType': {
          let label = val
          if (val === '2') label = '个股研报'
          if (val === '3') label = '行业研报'
          return <FilterTag>{label}</FilterTag>
        }
        case 'industryCode': {
          const codes = val.split(',')
          const labels = codes.map(
            (code) =>
              industryCodes.find((ic) => ic.value === code)?.label || code,
          )
          return (
            <div className='flex items-center gap-1 flex-wrap'>
              {labels.map((label) => (
                <FilterTag key={label}>{label}</FilterTag>
              ))}
            </div>
          )
        }
        case 'columnCode': {
          const columnCodesList = val.split(',')
          const labels = columnCodesList.map(
            (code) =>
              columnCodes.find((cc) => cc.value === code)?.label || code,
          )
          return (
            <div className='flex items-center gap-1 flex-wrap'>
              {labels.map((label) => (
                <FilterTag key={label}>{label}</FilterTag>
              ))}
            </div>
          )
        }
        case 'stockCode': {
          const label = stockList.find((s) => s.value === val)?.label || val
          return <FilterTag>{label}</FilterTag>
        }
        case 'orgCode': {
          const institutionCodes = val.split(',')
          const labels = institutionCodes.map(
            (code) =>
              institutionList.find((ic) => ic.value === code)?.label || code,
          )
          return (
            <div className='flex items-center gap-1 flex-wrap'>
              {labels.map((label) => (
                <FilterTag key={label}>{label}</FilterTag>
              ))}
            </div>
          )
        }
        case 'attachPages': {
          const label = `> ${val}`
          return <FilterTag>{label}</FilterTag>
        }
        case 'author': {
          const authors = val.split(',')
          const labels = authors.map((author) => {
            const parts = author.split('.')
            return parts.length > 1 ? parts.slice(1).join('.') : author
          })
          return (
            <div className='flex items-center gap-1 flex-wrap'>
              {labels.map((label) => (
                <FilterTag key={label}>{label}</FilterTag>
              ))}
            </div>
          )
        }
        default:
          return <FilterTag>{val}</FilterTag>
      }
    })(key, value)

    return (
      <>
        <span className='font-semibold mr-2'>{displayName[key] || key}</span>
        <span>{displayValue}</span>
      </>
    )
  }

  return (
    <div className='mb-4 p-2 border rounded-lg bg-muted min-h-[40px] flex items-center flex-wrap gap-2'>
      {Object.entries(activeFilters).map(([key, value]) => (
        <div
          key={key}
          className='bg-primary/10 text-foreground rounded-md px-2 py-1 text-sm flex items-center'
        >
          {getFilterDisplay(key, value)}
          <button
            onClick={() => clearSingleFilter(key)}
            className='ml-2 text-sm hover:text-destructive'
          >
            ⓧ
          </button>
        </div>
      ))}
      <Button
        variant='ghost'
        size='sm'
        onClick={handleClearFilters}
        className='text-muted-foreground hover:text-destructive'
      >
        <Trash2 className='h-4 w-4' />
        清除筛选
      </Button>
    </div>
  )
}
