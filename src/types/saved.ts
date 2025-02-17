
import { ReactNode } from 'react'

export type SavedSectionItem = {
  id: string
  label: string
  count: number
  icon: ReactNode
}

export type SavedItem = {
  id: string
  is_read: boolean
  is_flagged: boolean
  tag?: string
  category?: string
  saved_items_tags?: {
    tags: {
      name: string
    }
  }[]
}
