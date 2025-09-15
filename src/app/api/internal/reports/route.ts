import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { Value, ResultSet } from '@libsql/client'
import { Report } from '@/lib/types'

// Helper to convert ResultSet to a more usable array of objects
function resultSetToObjects(rs: ResultSet): Partial<Report>[] {
  return rs.rows.map((row) => {
    const obj: { [key: string]: Value } = {}
    for (let i = 0; i < rs.columns.length; i++) {
      const camelKey = rs.columns[i].replace(/_([a-zA-Z])/g, (g) =>
        g[1].toUpperCase(),
      )
      obj[camelKey] = row[i]
    }

    const report = obj as Omit<Partial<Report>, 'authors'> & { author?: string }

    let summary = ''
    if (report.content && typeof report.content === 'string') {
      // A simple way to generate summary: strip HTML and truncate
      summary =
        report.content
          .replace(/<[^>]*>?/gm, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Collapse whitespace
          .trim()
          .substring(0, 200) + '...'
    }

    const authors = report.author
      ? report.author.split(',').map((name) => name.trim())
      : []
    const authorNames = authors.map((name) => name.split('.').pop() || '')

    return {
      ...report,
      authors: authors,
      authorNames: authorNames,
      summary: summary,
      pdfLink: report.pdfLink,
    }
  })
}

async function fetchReportsFromDb(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
  const sortBy = searchParams.get('sortBy') || 'publishDate'
  const order = searchParams.get('order') === 'asc' ? 'ASC' : 'DESC'

  const reportType = searchParams.get('reportType')?.split(',')
  const industryCode = searchParams.get('industryCode')?.split(',')
  const stockCode = searchParams.get('stockCode')?.split(',')
  const columnCode = searchParams.get('columnCode')?.split(',')
  const orgCode = searchParams.get('orgCode')?.split(',')
  const author = searchParams.get('author')?.split(',')
  const market = searchParams.get('market')?.split(',')
  const contentQuery = searchParams.get('contentQuery')
  const attachPages = searchParams.get('attachPages')

  const offset = (page - 1) * pageSize

  const whereClauses: string[] = [`pdfLink IS NOT NULL`]
  const params: Value[] = []
  let useFts = false

  // Helper to add multi-value 'OR' conditions wrapped in parentheses
  const addOrCondition = (field: string, values: string[] | undefined) => {
    if (values && values.length > 0) {
      const placeholders = values.map(() => '?').join(', ')
      whereClauses.push(`${field} IN (${placeholders})`)
      params.push(...values)
    }
  }

  addOrCondition('reportType', reportType)
  addOrCondition('industryCode', industryCode)
  addOrCondition('stockCode', stockCode)
  addOrCondition('column', columnCode)
  addOrCondition('orgCode', orgCode)
  addOrCondition('market', market)

  if (author && author.length > 0) {
    const authorIds = author.map((auth) => auth.split('.')[0]).filter(Boolean)
    if (authorIds.length > 0) {
      const placeholders = authorIds.map(() => '?').join(', ')
      // 使用子查询高效地利用 report_author_index 表进行过滤
      whereClauses.push(
        `id IN (SELECT report_id FROM report_author_index WHERE author_id IN (${placeholders}))`,
      )
      params.push(...authorIds)
    }
  }

  if (contentQuery) {
    const allKeywords = contentQuery
      .trim()
      .split(/[ \u3000]+/)
      .filter((kw) => kw)

    if (allKeywords.some((kw) => kw.length < 2)) {
      throw new Error('搜索关键词的每个词长度必须大于等于两个字符')
    }

    const ftsKeywords = allKeywords.filter((kw) => kw.length >= 3)
    const likeKeywords = allKeywords.filter((kw) => kw.length === 2)

    if (ftsKeywords.length > 0) {
      useFts = true
      const ftsQueryString = ftsKeywords.map((kw) => `"${kw}"`).join(' AND ')
      whereClauses.push(`reports_fts.content_text MATCH ?`)
      params.push(ftsQueryString)
    }

    if (likeKeywords.length > 0) {
      const likeClauses = likeKeywords
        .map(() => `reports.content_text LIKE ?`)
        .join(' AND ')
      whereClauses.push(`(${likeClauses})`)
      likeKeywords.forEach((kw) => params.push(`%${kw}%`))
    }
  }

  if (attachPages) {
    whereClauses.push(`attachPages >= ?`)
    params.push(parseInt(attachPages, 10))
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const fromClause = useFts
    ? 'FROM reports JOIN reports_fts ON reports.id = reports_fts.rowid'
    : 'FROM reports'

  const validSortColumns = ['publishDate', 'title', 'orgSName']
  const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'publishDate'

  const selectFields = `
    infoCode, title, publishDate, reportType, stockCode, stockName,
    industryCode, industryName, indvInduCode, indvInduName,
    orgCode, orgSName, author, "column", market, attachPages,
    attachSize, pdfLink, content
  `
  const dataQuery = `SELECT ${selectFields.replace(/content/g, 'reports.content')} ${fromClause} ${whereSql} ORDER BY ${orderBy} ${order}, infoCode ${order} LIMIT ? OFFSET ?`
  const dataParams = [...params, pageSize, offset]

  console.log('--- DEBUG SQL ---')
  console.log('Data Query:', dataQuery)
  console.log('Data Params:', dataParams)

  const reportsResult = await db.execute({ sql: dataQuery, args: dataParams })
  const reports = resultSetToObjects(reportsResult)

  const countQuery = `SELECT COUNT(*) as count ${fromClause} ${whereSql}`

  // console.log('Count Query:', countQuery)
  // console.log('Count Params:', params)
  // console.log('-----------------')

  const countResult = await db.execute({ sql: countQuery, args: params })
  const totalItems = (countResult.rows[0]?.count as number) ?? 0

  return {
    data: reports,
    pagination: {
      currentPage: page,
      pageSize: pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const data = await fetchReportsFromDb(request)
    return NextResponse.json(data)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === '搜索关键词的每个词长度必须大于等于两个字符'
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Failed to fetch reports from database:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
