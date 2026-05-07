'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: number
}

export function SanaLoading({ className, size = 40 }: Props) {
  return (
    <div
      className={cn('pointer-events-none', className)}
      style={{ width: size, height: size }}
    >
      <DotLottieReact
        src="/sana-loading.lottie"
        loop
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  )
}
