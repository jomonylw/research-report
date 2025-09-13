export const ReportCardSkeleton = () => (
  <div className='p-4 border rounded-lg bg-card mb-4'>
    <div className='animate-pulse'>
      <div className='flex justify-between items-start'>
        <div className='h-6 bg-muted rounded w-3/4'></div>
        <div className='h-4 bg-muted rounded w-24'></div>
      </div>

      <div className='flex flex-wrap gap-x-4 gap-y-2 mt-2 items-center'>
        <div className='h-6 w-24 bg-muted rounded-md'></div>
        <div className='h-6 w-32 bg-muted rounded-md'></div>
        <div className='h-6 w-28 bg-muted rounded-md'></div>
        <div className='h-6 w-20 bg-muted rounded-md'></div>
      </div>

      <div className='mt-3 space-y-2'>
        <div className='h-4 bg-muted rounded w-full'></div>
        <div className='h-4 bg-muted rounded w-5/6'></div>
        <div className='h-4 bg-muted rounded w-full'></div>
      </div>

      <div className='flex justify-end mt-4'>
        <div className='h-9 w-28 bg-muted rounded-md'></div>
      </div>
    </div>
  </div>
)
