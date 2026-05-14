'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { ProImageViewer } from '@/components/pro-image-viewer'

export default function ImagenViewerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const imageUrl = searchParams.get('src')
  const title = searchParams.get('title') || 'Imagen adjunta'

  if (!imageUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">No se recibió ninguna imagen para visualizar.</p>
      </div>
    )
  }

  return <ProImageViewer imageUrl={imageUrl} title={title} onBack={() => router.back()} />
}