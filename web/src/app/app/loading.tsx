export default function Loading() {
  return (
    <div className='relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-6'>
      <div className='flex flex-1 min-h-0 gap-4 items-stretch'>
        {/* Sidebar skeleton */}
        <div className='w-56 rounded-lg overflow-hidden'>
          <div className='flex p-2 flex-col bg-black/20 h-[calc(100vh-13rem)]'>
            <div className='space-y-2'>
              <div className='h-14 w-14 mx-auto rounded-full bg-white/10 animate-pulse' />
              <div className='h-8 rounded-md bg-white/5' />
              <div className='h-6 rounded-md bg-white/5' />
              <div className='h-6 rounded-md bg-white/5' />
            </div>
            <div className='mt-auto h-9 rounded-md bg-white/5' />
          </div>
        </div>
        {/* Content skeleton */}
        <div className='flex-1 min-h-0 flex flex-col'>
          <div className='flex items-center justify-end pb-4'>
            <div className='flex items-center gap-3'>
              <div className='text-right'>
                <div className='h-4 w-36 rounded bg-white/10 animate-pulse' />
                <div className='mt-2 h-3 w-24 rounded bg-white/10 animate-pulse' />
              </div>
              <div className='h-10 w-10 rounded-full bg-white/10 animate-pulse' />
            </div>
          </div>
          <div className='flex-1 min-h-0'>
            <div className='h-full rounded-md border border-white/10 bg-black/10' />
          </div>
        </div>
      </div>
    </div>
  );
}
