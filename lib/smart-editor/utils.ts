import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as data URL'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const kilo = 1024
  const units = ['Bytes', 'KB', 'MB', 'GB']
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(kilo))
  const value = bytes / Math.pow(kilo, unitIndex)
  return `${parseFloat(value.toFixed(2))} ${units[unitIndex]}`
}
// Author: Bin Lee (blee@filynai.com)
// Description: Collection of generic utility helpers shared across the editor experience.
