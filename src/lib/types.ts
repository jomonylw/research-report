export interface Report {
  infoCode: string | null
  title: string | null
  publishDate: string | null
  reportType: string | null
  stockName: string | null // Added
  stockCode: string | null // Added
  market: string | null
  orgSName: string | null
  orgCode: string | null
  authors: string[]
  authorNames: string[]
  industryName: string | null
  industryCode: string | null
  indvInduName: string | null
  indvInduCode: string | null
  summary: string
  content: string | null
  attachPages: number | null
  pdfLink: string | null
  attachSize: number | null
  column: string | null
}

export interface Pagination {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}
export interface ReportSearchQuery {
  query?: string
  reportType?: string
  industry?: string
  page?: number
  pageSize?: number
  attachPages?: number
}
