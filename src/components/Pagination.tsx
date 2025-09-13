'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const [inputPage, setInputPage] = useState('');

  if (totalPages <= 1) return null;

  const handleJump = () => {
    const page = parseInt(inputPage, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setInputPage('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleJump();
    }
  };

  return (
    <div className="mt-8 flex justify-center items-center space-x-2">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm">
        {currentPage} / {totalPages}
      </span>
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          min="1"
          max={totalPages}
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-18 h-9"
          placeholder="页码"
        />
        <Button onClick={handleJump} variant="outline">
          <CornerDownLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};