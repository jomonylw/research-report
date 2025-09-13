'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import industryCodes from '@/lib/industry-codes.json';
import columnCodes from '@/lib/column-codes.json';


export interface FilterState {
  reportType: string;
  industryCode: string[];
  columnCode: string[];
  stockCode: string;
  orgCode: string[];
  author: string[];
  contentQuery: string;
  attachPages: number;
}

interface ReportFiltersProps {
  onFilterChange: (query: string) => void;
}

interface Stock {
  value: string;
  label: string;
}

interface Institution {
  value: string;
  label: string;
}

// Helper component for virtualized lists
const VirtualizedList = ({ items, title, selectedValue, onSelect, isMultiSelect = false, selectedValues = [] }: {
  items: (Stock | Institution)[];
  title: string;
  selectedValue?: string;
  selectedValues?: string[];
  onSelect: (value: string) => void;
  isMultiSelect?: boolean;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  return (
    <Command>
      <CommandInput placeholder={`搜索${title}`} />
      <CommandList ref={parentRef} style={{ height: '224px', overflow: 'auto' }}>
        <CommandEmpty>{`未找到${title}`}</CommandEmpty>
        {virtualizer.getTotalSize() > 0 && (
          <CommandGroup style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = items[virtualItem.index];
              const isSelected = isMultiSelect
                ? selectedValues?.includes(item.value)
                : selectedValue === item.value;

              return (
                <CommandItem
                  key={virtualItem.key}
                  onSelect={() => onSelect(item.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )}
                  >
                    <Check className={cn('h-4 w-4')} />
                  </div>
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
};


export const ReportFilters = ({ onFilterChange }: ReportFiltersProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [stockList, setStockList] = useState<Stock[]>([]);
  const [institutionList, setInstitutionList] = useState<Institution[]>([]);
  // Local state for the keyword input
  const [keyword, setKeyword] = useState(searchParams.get('contentQuery') || '');

  const [filters, setFilters] = useState<FilterState>({
    reportType: searchParams.get('reportType') || '',
    industryCode: searchParams.get('industryCode')?.split(',').filter(Boolean) || [],
    columnCode: searchParams.get('columnCode')?.split(',').filter(Boolean) || [],
    stockCode: searchParams.get('stockCode') || '',
    orgCode: searchParams.get('orgCode')?.split(',').filter(Boolean) || [],
    author: searchParams.get('author')?.split(',').filter(Boolean) || [],
    contentQuery: searchParams.get('contentQuery') || '',
    attachPages: Number(searchParams.get('attachPages')) || 0,
  });

  useEffect(() => {
    setFilters({
      reportType: searchParams.get('reportType') || '',
      industryCode: searchParams.get('industryCode')?.split(',').filter(Boolean) || [],
      columnCode: searchParams.get('columnCode')?.split(',').filter(Boolean) || [],
      stockCode: searchParams.get('stockCode') || '',
      orgCode: searchParams.get('orgCode')?.split(',').filter(Boolean) || [],
      author: searchParams.get('author')?.split(',').filter(Boolean) || [],
      contentQuery: searchParams.get('contentQuery') || '',
      attachPages: Number(searchParams.get('attachPages')) || 0,
    });
    // Sync local keyword state when URL changes
    setKeyword(searchParams.get('contentQuery') || '');
  }, [searchParams]);

  const updateQuery = (key: keyof FilterState, value: string | number | string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if ( (Array.isArray(value) && value.length > 0) || (typeof value === 'string' && value.trim() !== '') || (typeof value === 'number' && (key !== 'attachPages' || value !== 0)) ) {
        const paramValue = Array.isArray(value) ? value.join(',') : String(value);
        params.set(key, paramValue);
    } else {
        params.delete(key);
    }

    params.set('page', '1');
    const queryString = params.toString();
    router.push(`?${queryString}`);
    onFilterChange(queryString);
  };

  const debouncedUpdateQuery = useDebouncedCallback((key: keyof FilterState, value: string | number | string[]) => {
    updateQuery(key, value);
  }, 500);
  
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/filter-options');
        const data = await response.json();
        setStockList(data.stocks);
        setInstitutionList(data.institutions);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);
  
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const handleSearch = () => {
    updateQuery('contentQuery', keyword);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const attachPages = Number(e.target.value)
    // We only set the local state for a responsive UI, the URL is the source of truth
    setFilters(prev => ({ ...prev, attachPages }));
    debouncedUpdateQuery('attachPages', attachPages);
  };

  const handleReportTypeClick = (type: string) => {
    const newType = filters.reportType === type ? '' : type;
    updateQuery('reportType', newType);
  };

  const handleIndustryChange = (value: string, isSelectAll = false) => {
    let newSelection: string[];
    if (isSelectAll) {
      const allSelected = filters.industryCode.length === industryCodes.length;
      newSelection = allSelected ? [] : industryCodes.map(c => c.value);
    } else {
      newSelection = filters.industryCode.includes(value)
        ? filters.industryCode.filter(code => code !== value)
        : [...filters.industryCode, value];
    }
    updateQuery('industryCode', newSelection);
  };

  const handleStockChange = (value: string) => {
    const newSelection = filters.stockCode === value ? '' : value;
    updateQuery('stockCode', newSelection);
  };

  const handleColumnChange = (value: string) => {
    const newSelection = filters.columnCode.includes(value)
      ? filters.columnCode.filter(code => code !== value)
      : [...filters.columnCode, value];
    updateQuery('columnCode', newSelection);
  };

  const handleInstitutionChange = (value: string) => {
    const newSelection = filters.orgCode.includes(value)
      ? filters.orgCode.filter(code => code !== value)
      : [...filters.orgCode, value];
    updateQuery('orgCode', newSelection);
  };

  const handleClearFilters = () => {
    // Reset local state for immediate UI feedback
    setFilters({
      reportType: '',
      industryCode: [],
      columnCode: [],
      stockCode: '',
      orgCode: [],
      author: [],
      contentQuery: '',
      attachPages: 0,
    });
    setKeyword('');

    // Build a clean query string
    const params = new URLSearchParams();
    params.set('page', '1');
    const queryString = params.toString();
    router.push(`?${queryString}`);
    onFilterChange(queryString);
  };

  const ActiveFiltersDisplay = () => {
    const activeFilters: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
        if (key !== 'page' && key !== 'pageSize' && value) {
            activeFilters[key] = value;
        }
    }

    const clearSingleFilter = (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      router.push(`?${params.toString()}`);
    };

    const hasActiveFilters = Object.keys(activeFilters).length > 0;

    if (!hasActiveFilters) {
      return null;
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
        };

        const displayValue = ((key: string, val: string) => {
            switch (key) {
                case 'reportType':
                    if (val === '2') return '个股研报';
                    if (val === '3') return '行业研报';
                    return val;
                case 'industryCode':
                    const codes = val.split(',');
                    if (codes.length > 2) {
                      return `已选择 ${codes.length} 个`;
                    }
                    return codes.map(code => industryCodes.find(ic => ic.value === code)?.label || code).join(', ');
                case 'columnCode':
                    const columnCodesList = val.split(',');
                    if (columnCodesList.length > 2) {
                      return `已选择 ${columnCodesList.length} 个`;
                    }
                    return columnCodesList.map(code => columnCodes.find(cc => cc.value === code)?.label || code).join(', ');
                case 'stockCode':
                    return stockList.find(s => s.value === val)?.label || val;
                case 'orgCode':
                    const institutionCodes = val.split(',');
                    if (institutionCodes.length > 2) {
                      return `已选择 ${institutionCodes.length} 个`;
                    }
                    return institutionCodes.map(code => institutionList.find(ic => ic.value === code)?.label || code).join(', ');
                case 'attachPages':
                    return `> ${val}`;
                default:
                    return val;
            }
        })(key, value);

        return `${displayName[key] || key}: ${displayValue}`;
    }

    return (
      <div className="mb-4 p-2 border rounded-lg bg-muted min-h-[40px] flex items-center flex-wrap gap-2">
        {Object.entries(activeFilters).map(([key, value]) => (
          <div key={key} className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-sm flex items-center">
            <span>{getFilterDisplay(key, value)}</span>
            <button onClick={() => clearSingleFilter(key)} className="ml-2 text-xs">ⓧ</button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          清除筛选
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="p-4 border rounded-lg bg-card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 relative flex items-center">
            <Input
              name="contentQuery"
              placeholder="关键词搜索 ..."
              value={keyword}
              onChange={handleKeywordChange}
              onKeyDown={handleKeyDown}
              className="pr-10"
            />
            <Button onClick={handleSearch} size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-muted">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <span>
                  {filters.industryCode.length > 0
                    ? `已选择 ${filters.industryCode.length} 个行业`
                    : '选择行业 ...'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder={'搜索行业'} />
                <CommandList>
                  <CommandEmpty>{'未找到行业'}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => handleIndustryChange('all', true)}>
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          filters.industryCode.length === industryCodes.length
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible',
                        )}
                      >
                        <Check className={cn('h-4 w-4')} />
                      </div>
                      <span>{'全选'}</span>
                    </CommandItem>
                    {industryCodes.map((industry) => {
                      const isSelected = filters.industryCode.includes(
                        industry.value,
                      );
                      return (
                        <CommandItem
                          key={industry.value}
                          onSelect={() => handleIndustryChange(industry.value)}
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible',
                            )}
                          >
                            <Check className={cn('h-4 w-4')} />
                          </div>
                          <span>
                            {industry.label}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <span>
                  {filters.columnCode.length > 0
                    ? `已选择 ${filters.columnCode.length} 个栏目`
                    : '选择栏目 ...'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder={'搜索栏目'} />
                <CommandList>
                  <CommandEmpty>{'未找到栏目'}</CommandEmpty>
                  <CommandGroup>
                    {columnCodes.map((column) => {
                      const isSelected = filters.columnCode.includes(
                        column.value,
                      );
                      return (
                        <CommandItem
                          key={column.value}
                          onSelect={() => handleColumnChange(column.value)}
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible',
                            )}
                          >
                            <Check className={cn('h-4 w-4')} />
                          </div>
                          <span>
                            {column.label}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <span>
                  {filters.stockCode
                    ? stockList.find(s => s.value === filters.stockCode)?.label
                    : '选择股票 ...'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <VirtualizedList
                items={stockList}
                title="股票"
                selectedValue={filters.stockCode}
                onSelect={handleStockChange}
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <span>
                  {filters.orgCode.length > 0
                    ? `已选择 ${filters.orgCode.length} 个机构`
                    : '选择机构 ...'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <VirtualizedList
                items={institutionList}
                title="机构"
                selectedValues={filters.orgCode}
                onSelect={handleInstitutionChange}
                isMultiSelect
              />
            </PopoverContent>
          </Popover>
          <div className="lg:col-span-2 pr-1 flex flex-col gap-2 justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-25 text-center bg-muted rounded-md px-2 py-2">
                页数 {'> ' + filters.attachPages}
              </span>
              <input
                id="attachPages"
                name="attachPages"
                type="range"
                min="0"
                max="30"
                step="5"
                value={filters.attachPages}
                onChange={handleSliderChange}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
          <div className="lg:col-span-4 flex items-center space-x-2">
            <Button variant={!filters.reportType ? 'secondary' : 'outline'} onClick={() => handleReportTypeClick('')}>全部类型</Button>
            <Button variant={filters.reportType === '2' ? 'secondary' : 'outline'} onClick={() => handleReportTypeClick('2')}>个股研报</Button>
            <Button variant={filters.reportType === '3' ? 'secondary' : 'outline'} onClick={() => handleReportTypeClick('3')}>行业研报</Button>
          </div>
        </div>
      </div>
      <ActiveFiltersDisplay />
    </>
  );
};