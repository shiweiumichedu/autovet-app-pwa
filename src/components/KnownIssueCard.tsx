import React, { useState } from 'react'
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { VehicleKnownIssue } from '../types'

interface KnownIssueCardProps {
  issue: VehicleKnownIssue
}

const severityConfig = {
  critical: {
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
  },
  high: {
    bg: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
  },
  medium: {
    bg: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />,
  },
  low: {
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    icon: <Info className="w-3.5 h-3.5 text-blue-600" />,
  },
}

export const KnownIssueCard: React.FC<KnownIssueCardProps> = ({ issue }) => {
  const [expanded, setExpanded] = useState(false)
  const config = severityConfig[issue.severity] || severityConfig.medium

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className={`w-full text-left rounded-lg border px-2.5 py-1.5 touch-manipulation ${config.bg}`}
    >
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">{config.icon}</div>
        <span className="flex-1 text-[13px] font-medium text-gray-900 truncate">
          {issue.title}
        </span>
        <span className={`px-1.5 py-px text-[9px] font-medium rounded-full flex-shrink-0 ${config.badge}`}>
          {issue.severity}
        </span>
        <span className="text-[9px] text-gray-400 flex-shrink-0 capitalize">{issue.category}</span>
        {expanded
          ? <ChevronUp className="w-3 h-3 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
        }
      </div>
      {expanded && (
        <div className="mt-1.5 ml-5.5 pl-0.5">
          <p className="text-xs text-gray-600 leading-relaxed">
            {issue.description}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            {issue.source && (
              <span className="text-[10px] text-gray-500">{issue.source}</span>
            )}
            <span className="text-gray-300">|</span>
            <span className="text-[10px] text-gray-500">
              {issue.yearStart}-{issue.yearEnd}
            </span>
          </div>
        </div>
      )}
    </button>
  )
}
