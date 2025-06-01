import { ReactNode } from 'react'

export type SavedSectionItem = {
  id: string
  label: string
  count: number
  icon: ReactNode
}

export type SavedItem = {
  id: string
  category: string
  content: string | null
  created_at: string
  created_by: string | null
  deleted_at: string | null
  is_flagged: boolean | null
  is_read: boolean | null
  sender_id: string | null
  tag: string | null
  title: string
  updated_at: string
  user_id: string
  saved_items_tags?: {
    tags: {
      name: string
    }
  }[]
}
