import type { Experimental_GeneratedImage } from "ai"
import NextImage from "next/image"
import { cn } from "@/lib/utils"

export type ImageProps = Experimental_GeneratedImage & {
  className?: string
  alt?: string
  width?: number
  height?: number
}

export const Image = ({
  base64,
  mediaType,
  className,
  alt,
  width,
  height,
}: ImageProps) => {
  const resolvedWidth = width ?? 512
  const resolvedHeight = height ?? 512

  return (
    <NextImage
      alt={alt ?? "Generated image"}
      className={cn("h-auto max-w-full overflow-hidden rounded-md", className)}
      src={`data:${mediaType};base64,${base64}`}
      width={resolvedWidth}
      height={resolvedHeight}
      unoptimized
    />
  )
}
