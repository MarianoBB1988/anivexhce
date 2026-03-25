'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, ImageIcon, Trash2, Upload, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Documento } from '@/lib/types'
import { getDocumentos, uploadDocumento, deleteDocumento, getDocumentoUrl } from '@/lib/services'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DocumentosPanelProps {
  idEntidad: string
  tipoEntidad: 'consulta' | 'cirugia'
  idClinica: string
  readonly?: boolean
}

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif,application/pdf'
const MAX_MB = 10

function isImage(nombre: string) {
  return /\.(jpe?g|png|gif|webp)$/i.test(nombre)
}

export function DocumentosPanel({ idEntidad, tipoEntidad, idClinica, readonly = false }: DocumentosPanelProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingDoc, setDeletingDoc] = useState<Documento | null>(null)

  const load = useCallback(async () => {
    if (!idEntidad) { setLoading(false); return }
    setLoading(true)
    const res = await getDocumentos(idEntidad, tipoEntidad, idClinica)
    if (res.success && res.data) setDocs(res.data)
    else setDocs([])
    setLoading(false)
  }, [idEntidad, tipoEntidad, idClinica])

  useEffect(() => { load() }, [load])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: `El archivo supera ${MAX_MB} MB`, variant: 'destructive' })
      return
    }

    setUploading(true)
    const res = await uploadDocumento(file, idEntidad, tipoEntidad, idClinica)
    if (res.success) {
      toast({ title: 'Archivo subido', description: file.name })
      await load()
    } else {
      toast({ title: 'Error al subir', description: res.error ?? '', variant: 'destructive' })
    }
    setUploading(false)
  }

  const handleOpen = async (doc: Documento) => {
    const url = await getDocumentoUrl(doc.url)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDelete = async () => {
    if (!deletingDoc) return
    const res = await deleteDocumento(deletingDoc, idClinica)
    if (res.success) {
      toast({ title: 'Archivo eliminado' })
      setDocs(d => d.filter(x => x.id !== deletingDoc.id))
    } else {
      toast({ title: 'Error al eliminar', description: res.error ?? '', variant: 'destructive' })
    }
    setDeletingDoc(null)
  }

  return (
    <div className="space-y-4 py-2">
      {!idEntidad ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Guardá primero los datos del registro para poder adjuntar documentos.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? '...' : `${docs.length} archivo${docs.length !== 1 ? 's' : ''}`}
            </p>
            {!readonly && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="size-4" />
                  {uploading ? 'Subiendo...' : 'Subir archivo'}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>

          <Separator />

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : docs.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {readonly ? 'Sin archivos adjuntos.' : 'No hay archivos adjuntos. Subí imágenes o PDFs.'}
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
                  {isImage(doc.nombre)
                    ? <ImageIcon className="size-4 shrink-0 text-blue-500" />
                    : <FileText className="size-4 shrink-0 text-red-500" />
                  }
                  <span className="flex-1 truncate text-sm font-medium">{doc.nombre}</span>
                  {doc.created_at && (
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  )}
                  <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => handleOpen(doc)}>
                    <ExternalLink className="size-3.5" />
                  </Button>
                  {!readonly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => setDeletingDoc(doc)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <AlertDialog open={!!deletingDoc} onOpenChange={(open) => { if (!open) setDeletingDoc(null) }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará <strong>{deletingDoc?.nombre}</strong> permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
