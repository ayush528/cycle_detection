'use client'
import { useState } from 'react'

function TreeNode({ name, children, isRoot = false }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = children && Object.keys(children).length > 0

  return (
    <div className="tree-node-wrap">
      <div
        className="inline-flex items-center gap-2 py-0.5 cursor-pointer group"
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        {hasChildren && (
          <span className="text-[#3a3a3a] group-hover:text-[#6b6b6b] font-mono text-xs w-3 transition-colors select-none">
            {expanded ? '-' : '+'}
          </span>
        )}
        {!hasChildren && <span className="w-3" />}
        <span
          className={`font-mono text-sm transition-colors ${
            isRoot
              ? 'text-[#3b82f6] font-medium'
              : hasChildren
              ? 'text-[#e8e8e8]'
              : 'text-[#6b6b6b]'
          } group-hover:text-[#e8e8e8]`}
        >
          {name}
        </span>
        {isRoot && (
          <span className="text-[10px] font-mono text-[#3a3a3a]">root</span>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="tree-children">
          {Object.entries(children).map(([child, grandchildren]) => (
            <TreeNode key={child} name={child} children={grandchildren} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TreeView({ tree }) {
  if (!tree || Object.keys(tree).length === 0) return null

  return (
    <div>
      {Object.entries(tree).map(([root, children]) => (
        <TreeNode key={root} name={root} children={children} isRoot />
      ))}
    </div>
  )
}
