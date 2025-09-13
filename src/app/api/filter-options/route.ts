import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface FilterOption {
  id: number;
  type: 'I' | 'S';
  value: string;
  label: string;
}

export async function GET() {
  try {
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

    return NextResponse.json({ stocks, institutions });
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
  }
}
