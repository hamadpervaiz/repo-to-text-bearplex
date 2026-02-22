import { useState, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { isBinaryFile } from '../utils/formatter';

function TreeNode({ node, selected, onToggle, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = Object.values(node.children).sort((a, b) => {
    if (a.type === 'tree' && b.type !== 'tree') return -1;
    if (a.type !== 'tree' && b.type === 'tree') return 1;
    return a.name.localeCompare(b.name);
  });

  const isDir = node.type === 'tree';
  const isChecked = selected.has(node.path);
  const binary = !isDir && isBinaryFile(node.path);

  // Compute indeterminate state for directories
  const childState = useMemo(() => {
    if (!isDir) return null;
    const allPaths = getAllFilePaths(node);
    if (allPaths.length === 0) return 'none';
    const checkedCount = allPaths.filter(p => selected.has(p)).length;
    if (checkedCount === 0) return 'none';
    if (checkedCount === allPaths.length) return 'all';
    return 'some';
  }, [isDir, node, selected]);

  const handleCheck = () => {
    if (isDir) {
      const allPaths = getAllFilePaths(node);
      const allSelected = childState === 'all';
      onToggle(allPaths, !allSelected);
    } else {
      onToggle([node.path], !isChecked);
    }
  };

  const checkboxClass = `tree-checkbox${childState === 'some' ? ' indeterminate' : ''}`;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 px-2 hover:bg-[var(--bg-tertiary)] rounded cursor-pointer group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0 border-0 bg-transparent text-[var(--text-secondary)] cursor-pointer flex-shrink-0"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <input
          type="checkbox"
          checked={isDir ? childState === 'all' : isChecked}
          onChange={handleCheck}
          className={checkboxClass}
        />

        {isDir ? (
          expanded ? <FolderOpen className="w-4 h-4 text-[var(--accent)] flex-shrink-0" /> : <Folder className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
        ) : (
          <File className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
        )}

        <span
          className={`text-sm truncate ${binary ? 'text-[var(--text-secondary)] italic' : 'text-[var(--text-primary)]'}`}
          onClick={() => isDir && setExpanded(!expanded)}
        >
          {node.name}
        </span>

        {!isDir && node.size > 0 && (
          <span className="text-xs text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 ml-auto flex-shrink-0">
            {formatSize(node.size)}
          </span>
        )}
      </div>

      {isDir && expanded && children.map(child => (
        <TreeNode
          key={child.path}
          node={child}
          selected={selected}
          onToggle={onToggle}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function getAllFilePaths(node) {
  const paths = [];
  if (node.type !== 'tree') {
    paths.push(node.path);
  } else {
    for (const child of Object.values(node.children)) {
      paths.push(...getAllFilePaths(child));
    }
  }
  return paths;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DirectoryTree({ tree, selected, onSelectionChange }) {
  const children = Object.values(tree.children);
  const allPaths = useMemo(() => getAllFilePaths(tree), [tree]);

  const handleToggle = useCallback((paths, checked) => {
    onSelectionChange(prev => {
      const next = new Set(prev);
      for (const p of paths) {
        if (checked) next.add(p);
        else next.delete(p);
      }
      return next;
    });
  }, [onSelectionChange]);

  const selectedCount = selected.size;
  const totalCount = allPaths.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => handleToggle(allPaths, !allSelected)}
            className={`tree-checkbox${selectedCount > 0 && !allSelected ? ' indeterminate' : ''}`}
          />
          <span className="text-sm text-[var(--text-secondary)]">
            {selectedCount} / {totalCount} files selected
          </span>
        </div>
      </div>
      <div className="overflow-auto max-h-[500px] py-1">
        {children.sort((a, b) => {
          if (a.type === 'tree' && b.type !== 'tree') return -1;
          if (a.type !== 'tree' && b.type === 'tree') return 1;
          return a.name.localeCompare(b.name);
        }).map(child => (
          <TreeNode
            key={child.path}
            node={child}
            selected={selected}
            onToggle={handleToggle}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
