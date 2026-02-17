import React from 'react'
import { Check, Square, MessageSquare } from 'lucide-react'
import { ChecklistItem } from '../types'

interface StepChecklistProps {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
  disabled?: boolean
}

const ratingColor = (r: number) => {
  if (r >= 4) return 'bg-green-500 text-white'
  if (r >= 3) return 'bg-yellow-400 text-white'
  if (r >= 1) return 'bg-red-500 text-white'
  return 'bg-gray-100 text-gray-400'
}

const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
}

export const StepChecklist: React.FC<StepChecklistProps> = ({
  items,
  onChange,
  disabled = false,
}) => {
  const toggleItem = (index: number) => {
    if (disabled) return
    const updated = [...items]
    const wasChecked = updated[index].checked
    updated[index] = {
      ...updated[index],
      checked: !wasChecked,
      rating: wasChecked ? 0 : (updated[index].rating || 5),
    }
    onChange(updated)
  }

  const updateNote = (index: number, note: string) => {
    if (disabled) return
    const updated = [...items]
    updated[index] = { ...updated[index], note }
    onChange(updated)
  }

  const updateRating = (index: number, rating: number) => {
    if (disabled) return
    const updated = [...items]
    const newRating = updated[index].rating === rating ? 0 : rating
    updated[index] = { ...updated[index], rating: newRating, checked: newRating > 0 }
    onChange(updated)
  }

  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null)

  return (
    <div className="bg-white rounded-lg border divide-y">
      {items.map((item, index) => (
        <div key={index}>
          {/* Main row */}
          <div className="flex items-center px-2 -my-px">
            <button
              type="button"
              onClick={() => toggleItem(index)}
              disabled={disabled}
              className="flex-shrink-0 mr-1.5 touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center -ml-0.5"
            >
              {item.checked ? (
                <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : (
                <Square className="w-4 h-4 text-gray-300" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="flex-1 text-left touch-manipulation"
            >
              <span
                className={`text-sm ${
                  item.checked ? 'text-gray-400 line-through' : 'text-gray-900'
                }`}
              >
                {item.item}
              </span>
            </button>
            {/* Rating badge */}
            <span
              className={`flex-shrink-0 w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${ratingColor(item.rating)}`}
            >
              {item.rating || '-'}
            </span>
            <button
              type="button"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className={`flex-shrink-0 p-0.5 ml-1 rounded touch-manipulation ${
                item.note ? 'text-blue-500' : 'text-gray-300'
              }`}
              disabled={disabled}
            >
              <MessageSquare className="w-3 h-3" />
            </button>
          </div>

          {/* Expanded: rating + note */}
          {expandedIndex === index && (
            <div className="px-3 pb-2 pt-1">
              {/* 1-5 rating row */}
              <div className="flex items-center space-x-1.5 mb-1.5">
                <span className="text-[10px] text-gray-500 mr-0.5">Rate:</span>
                {[1, 2, 3, 4, 5].map((r) => (
                  <div key={r} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => updateRating(index, r)}
                      disabled={disabled}
                      className={`w-8 h-8 rounded text-sm font-medium touch-manipulation transition-colors ${
                        item.rating === r
                          ? ratingColor(r)
                          : item.rating >= r
                          ? ratingColor(r) + ' opacity-70'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {r}
                    </button>
                    <span className="text-[9px] text-gray-400 mt-0.5">{ratingLabels[r]}</span>
                  </div>
                ))}
              </div>
              {/* Note input */}
              <input
                type="text"
                value={item.note}
                onChange={(e) => updateNote(index, e.target.value)}
                placeholder="Add a note..."
                disabled={disabled}
                className="w-full text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                style={{ fontSize: '16px' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
