'use client'

import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useUploadThing } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'
import { Image, Loader2, MousePointerSquareDashed } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import Dropzone, { FileRejection } from 'react-dropzone'

const FileUploadPage = () => {
  const { toast } = useToast()
  const router = useRouter()
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isPending, startTransition] = useTransition()
  const [isUploadComplete, setIsUploadComplete] = useState<boolean>(false)

  const { startUpload, isUploading } = useUploadThing('imageUploader', {
    onClientUploadComplete: ([data]) => {
      if (!data) return
      
      setIsUploadComplete(true)
      setUploadProgress(100)
      
      // Small delay to show completion before redirect
      setTimeout(() => {
        const configId = data.serverData.configId
        startTransition(() => {
          router.push(`/configure/design?id=${configId}`)
        })
      }, 500)
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress)
    },
    onUploadError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
      setUploadProgress(0)
    },
  })

  const onDropRejected = (rejectedFiles: FileRejection[]) => {
    const [file] = rejectedFiles
    setIsDragOver(false)

    toast({
      title: `${file.file.type || 'File'} type is not supported`,
      description: 'Please choose a PNG, JPG, or JPEG image instead.',
      variant: 'destructive',
    })
  }

  const onDropAccepted = async (acceptedFiles: File[]) => {
    setIsDragOver(false)
    setIsUploadComplete(false)
    setUploadProgress(0)
    
    try {
      await startUpload(acceptedFiles, { configId: undefined })
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getUploadState = () => {
    
    if (isUploading && !isUploadComplete) {
      return (
        <div className="flex flex-col items-center">
          <p>Uploading...</p>
          <Progress
            value={uploadProgress}
            className="mt-2 w-40 h-2 bg-gray-300"
          />
        </div>
      )
    }

    if (isUploadComplete || isPending) {
      return (
        <div className="flex flex-col items-center">
          <p>Upload complete! Redirecting...</p>
        </div>
      )
    }

    if (isDragOver) {
      return (
        <p>
          <span className="font-semibold">Drop file</span> to upload
        </p>
      )
    }

    return (
      <p>
        <span className="font-semibold">Click to upload</span> or drag and drop
      </p>
    )
  }

  const getIcon = () => {
    if (isDragOver) {
      return <MousePointerSquareDashed className="h-6 w-6 text-zinc-500 mb-2" />
    }
    if (isUploading || isPending) {
      return <Loader2 className="animate-spin h-6 w-6 text-zinc-500 mb-2" />
    }
    return <Image className="h-6 w-6 text-zinc-500 mb-2" />
  }

  return (
    <div
      className={cn(
        'relative h-full flex-1 my-16 w-full rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl flex justify-center flex-col items-center',
        {
          'ring-blue-900/25 bg-blue-900/10': isDragOver,
        }
      )}
    >
      <div className="relative flex flex-1 flex-col items-center justify-center w-full">
        <Dropzone
          onDropRejected={onDropRejected}
          onDropAccepted={onDropAccepted}
          accept={{
            'image/png': ['.png'],
            'image/jpeg': ['.jpeg', '.jpg'],
          }}
          disabled={isUploading || isPending}
          onDragEnter={() => setIsDragOver(true)}
          onDragLeave={() => setIsDragOver(false)}
        >
          {({ getRootProps, getInputProps }) => (
            <div
              className="h-full w-full flex-1 flex flex-col items-center justify-center"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              {getIcon()}
              <div className="flex flex-col justify-center mb-2 text-sm text-zinc-700">
                {getUploadState()}
              </div>

              {!isUploading && !isPending && (
                <p className="text-xs text-zinc-500">PNG, JPG, JPEG</p>
              )}
            </div>
          )}
        </Dropzone>
      </div>
    </div>
  )
}

export default FileUploadPage