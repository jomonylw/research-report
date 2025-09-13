import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface FilterOption {
  id: number;
  type: 'I' | 'S';
  value: string;
  label: string;
}

async function getFilterOptionsFromDb() {
  const { rows } = await db.execute('SELECT id, type, value, label FROM filter_options');

  const options = rows as unknown as FilterOption[];

  // Sort using localeCompare for proper Chinese character sorting
  options.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));

  const stocks = options
    .filter(option => option.type === 'S')
    .map(option => ({ value: option.value, label: `${option.label} (${option.value})` }));

  const institutions = options
    .filter(option => option.type === 'I')
    .map(option => ({ value: option.value, label: option.label }));
  
  return { stocks, institutions };
}

export async function GET() {
  try {
    const data = await getFilterOptionsFromDb();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch filter options from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch filter options from DB' }, { status: 500 });
  }
}