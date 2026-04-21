'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface QuestionImageProps {
  imageUrl?: string | null
  codigoPlaca?: string | null
  className?: string
}

function normalizeSignCode(code: string) {
  const match = code.trim().replace(/\s+/g, '').match(/^([a-z]+)-?(\d+)([a-z]?)$/i)
  if (!match) return null

  const [, prefix, number, suffix] = match
  return `${prefix.toUpperCase()}-${number}${suffix.toLowerCase()}`
}

function getSignCodes(codigoPlaca?: string | null) {
  if (!codigoPlaca) return []

  return codigoPlaca
    .split(/\s*(?:,|;|\/|\+|\be\b)\s*/i)
    .map(normalizeSignCode)
    .filter((code): code is string => Boolean(code))
}

function getWikimediaSignUrl(code: string) {
  const fileName = `Brasil_${code}.svg`
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`
}

export function QuestionImage({ imageUrl, codigoPlaca, className }: QuestionImageProps) {
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set())
  const signCodes = getSignCodes(codigoPlaca)
  const images = imageUrl
    ? [{ src: imageUrl, label: codigoPlaca ? `Placa ${codigoPlaca}` : 'Imagem da questão' }]
    : signCodes.map((code) => ({
        src: getWikimediaSignUrl(code),
        label: `Placa ${code}`,
      }))

  const visibleImages = images.filter((image) => !failedSources.has(image.src))

  if (visibleImages.length === 0) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-4 rounded-xl border border-border/60 bg-background/45 p-4',
        className
      )}
    >
      {visibleImages.map((image) => (
        <figure key={image.src} className="flex min-w-28 flex-col items-center gap-2">
          {/* The source may be a user-provided URL or a Wikimedia redirect generated from codigoPlaca. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.label}
            loading="lazy"
            className="h-28 w-28 object-contain drop-shadow-sm sm:h-36 sm:w-36"
            onError={() =>
              setFailedSources((current) => {
                const next = new Set(current)
                next.add(image.src)
                return next
              })
            }
          />
          <figcaption className="text-xs font-medium text-muted-foreground">{image.label}</figcaption>
        </figure>
      ))}
    </div>
  )
}
