import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LightboxImage = {
  src: string
  alt: string
  label: string
}

type ImageLightboxProps = {
  images: LightboxImage[]
  currentIndex: number | null
  onChange: (index: number) => void
  onClose: () => void
}

function wrapIndex(index: number, length: number) {
  return (index + length) % length
}

export function ImageLightbox({ images, currentIndex, onChange, onClose }: ImageLightboxProps) {
  const isOpen = currentIndex !== null && images.length > 0
  const activeIndex = isOpen ? Math.min(currentIndex, images.length - 1) : 0
  const activeImage = images[activeIndex]
  const hasMultipleImages = images.length > 1

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (!hasMultipleImages) return

      if (event.key === 'ArrowLeft') {
        onChange(wrapIndex(activeIndex - 1, images.length))
      }

      if (event.key === 'ArrowRight') {
        onChange(wrapIndex(activeIndex + 1, images.length))
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, hasMultipleImages, images.length, isOpen, onChange, onClose])

  if (!isOpen || !activeImage) return null

  const goToPrevious = () => onChange(wrapIndex(activeIndex - 1, images.length))
  const goToNext = () => onChange(wrapIndex(activeIndex + 1, images.length))

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/85 p-3 text-white backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${activeImage.label} image preview`}
      onMouseDown={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-6xl flex-col gap-3"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm text-white/80">
            {activeImage.label}
            {hasMultipleImages ? ` · ${activeIndex + 1} of ${images.length}` : ''}
          </p>

          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={onClose}
            aria-label="Close image preview"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="relative min-h-0 flex-1">
          <img
            key={activeImage.src}
            src={activeImage.src}
            alt={activeImage.alt}
            className="mx-auto h-full max-h-[calc(100vh-9rem)] w-full animate-fade-in rounded-lg object-contain shadow-2xl"
          />

          {hasMultipleImages ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/45 text-white hover:bg-black/65 hover:text-white sm:left-4"
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/45 text-white hover:bg-black/65 hover:text-white sm:right-4"
                onClick={goToNext}
                aria-label="Next image"
              >
                <ChevronRight className="size-6" aria-hidden="true" />
              </Button>
            </>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="mx-auto flex max-w-full gap-2 overflow-x-auto rounded-lg bg-black/30 p-2">
            {images.map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                className={cn(
                  'size-14 shrink-0 overflow-hidden rounded-md border transition sm:size-16',
                  index === activeIndex ? 'border-white' : 'border-white/20 opacity-70 hover:opacity-100',
                )}
                onClick={() => onChange(index)}
                aria-label={`Show ${image.label}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              >
                <img src={image.src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
