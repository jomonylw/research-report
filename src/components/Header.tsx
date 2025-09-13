import Link from 'next/link'
import { FileSearch } from 'lucide-react'
import React from 'react'
import { ThemeToggle } from './theme-toggle'

const Header = () => {
  return (
    <header className='flex items-center justify-between py-4 px-6 bg-background'>
      <Link href='/'>
        <div className='flex items-center gap-2'>
          <FileSearch className='h-8 w-8 text-primary' />
          <h1 className='text-2xl font-bold'>
            <span className='bg-primary text-primary-foreground px-1 py-1 rounded-md mr-1'>
              研报
            </span>
            中心
          </h1>
        </div>
      </Link>
      <ThemeToggle />
    </header>
  )
}

export default Header
