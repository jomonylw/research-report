import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { Value, ResultSet } from "@libsql/client";
import { Report } from "@/lib/types";

// Helper to convert ResultSet to a more usable array of objects
function resultSetToObjects(rs: ResultSet): Partial<Report>[] {
    return rs.rows.map(row => {
        const obj: { [key: string]: Value } = {};
        for (let i = 0; i < rs.columns.length; i++) {
            const camelKey = rs.columns[i].replace(/_([a-zA-Z])/g, g => g[1].toUpperCase());
            obj[camelKey] = row[i];
        }

        const report = obj as Omit<Partial<Report>, 'authors'> & { author?: string };
        
        let summary = '';
        if (report.content && typeof report.content === 'string') {
            // A simple way to generate summary: strip HTML and truncate
            summary = report.content
                .replace(/<[^>]*>?/gm, '') // Remove HTML tags
                .replace(/\s+/g, ' ')      // Collapse whitespace
                .trim()
                .substring(0, 200) + '...';
        }

        const authors = report.author ? report.author.split(',').map(name => name.trim()) : [];
        const authorNames = authors.map(name => name.split('.').pop() || '');

        return {
            ...report,
            authors: authors,
            authorNames: authorNames,
            summary: summary,
            pdfLink: report.pdfLink,
        };
    });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const sortBy = searchParams.get("sortBy") || "publishDate";
    const order = searchParams.get("order") === 'asc' ? 'ASC' : 'DESC';

    const reportType = searchParams.get("reportType")?.split(',');
    const industryCode = searchParams.get("industryCode")?.split(',');
    const stockCode = searchParams.get("stockCode")?.split(',');
    const columnCode = searchParams.get("columnCode")?.split(',');
    const orgCode = searchParams.get("orgCode")?.split(',');
    const author = searchParams.get("author")?.split(',');
    const market = searchParams.get("market")?.split(',');
    const contentQuery = searchParams.get("contentQuery");
    const attachPages = searchParams.get("attachPages");

    const offset = (page - 1) * pageSize;
    
    const whereClauses: string[] = [`status = 'completed'`, `pdfLink IS NOT NULL`];
    const params: Value[] = [];

    // Helper to add multi-value 'OR' conditions wrapped in parentheses
    const addOrCondition = (field: string, values: string[] | undefined) => {
        if (values && values.length > 0) {
            const placeholders = values.map(() => '?').join(', ');
            whereClauses.push(`${field} IN (${placeholders})`);
            params.push(...values);
        }
    };
    
    addOrCondition('reportType', reportType);
    // addOrCondition('industryCode', industryCode);
    if (industryCode && industryCode.length > 0) {
        const placeholders = industryCode.map(() => '?').join(', ');
        whereClauses.push(`(industryCode IN (${placeholders}) OR indvInduCode IN (${placeholders}))`);
        params.push(...industryCode, ...industryCode);
    }
    addOrCondition('stockCode', stockCode);
    addOrCondition('column', columnCode);
    addOrCondition('orgCode', orgCode);
    addOrCondition('market', market);

    if (author && author.length > 0) {
        const authorClauses = author.map(() => `author LIKE ?`).join(' OR ');
        whereClauses.push(`(${authorClauses})`);
        author.forEach(auth => params.push(`%${auth}%`));
    }

    if (contentQuery) {
        const keywords = contentQuery.split(' ').filter(kw => kw.trim() !== '');
        if (keywords.length > 0) {
            const contentClauses = keywords.map(() => `content LIKE ?`).join(' AND ');
            whereClauses.push(`(${contentClauses})`);
            keywords.forEach(kw => params.push(`%${kw}%`));
        }
    }

    if (attachPages) {
        whereClauses.push(`attachPages >= ?`);
        params.push(parseInt(attachPages, 10));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Securely determine the order by column
    const validSortColumns = ['publishDate', 'title', 'orgSName'];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'publishDate';
    
    // Data query
    const dataQuery = `SELECT * FROM reports ${whereSql} ORDER BY ${orderBy} ${order}, infoCode ${order} LIMIT ? OFFSET ?`;
    const dataParams = [...params, pageSize, offset];
    const reportsResult = await db.execute({ sql: dataQuery, args: dataParams });
    const reports = resultSetToObjects(reportsResult);

    // Count query
    const countQuery = `SELECT COUNT(*) as count FROM reports ${whereSql}`;
    // The WHERE clause is the same for both the data and count queries, so the parameters should be the same.
    const countResult = await db.execute({ sql: countQuery, args: params });
    const totalItems = (countResult.rows[0]?.count as number) ?? 0;
    
    return NextResponse.json({
      data: reports,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch reports from database:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}