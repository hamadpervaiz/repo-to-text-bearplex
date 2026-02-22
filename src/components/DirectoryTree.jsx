import { useState, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FolderTree } from 'lucide-react';
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

  const ext = node.name.split('.').pop().toLowerCase();
  const fileColor = getFileColor(ext);

  return (
    <div>
      <div
        className="tree-row flex items-center gap-1.5 py-[3px] px-2 cursor-pointer group"
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
      >
        {isDir ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0 border-0 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer flex-shrink-0 transition-colors"
          >
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />
            }
          </button>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        <input
          type="checkbox"
          checked={isDir ? childState === 'all' : isChecked}
          onChange={handleCheck}
          className={checkboxClass}
        />

        {isDir ? (
          expanded
            ? <FolderOpen className="w-4 h-4 text-[var(--accent-light)] flex-shrink-0" />
            : <Folder className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
        ) : (
          <File className="w-4 h-4 flex-shrink-0" style={{ color: fileColor }} />
        )}

        <span
          className={`text-[13px] truncate leading-tight ${
            binary
              ? 'text-[var(--text-muted)] italic'
              : isDir
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-secondary)]'
          }`}
          onClick={() => isDir && setExpanded(!expanded)}
        >
          {node.name}
        </span>

        {!isDir && node.size > 0 && (
          <span className="text-[11px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 ml-auto flex-shrink-0 tabular-nums transition-opacity">
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

function getFileColor(ext) {
  const colors = {
    js: '#f7df1e', jsx: '#61dafb', ts: '#3178c6', tsx: '#3178c6',
    py: '#3776ab', rb: '#cc342d', go: '#00add8', rs: '#dea584',
    java: '#b07219', css: '#563d7c', scss: '#c6538c', html: '#e34c26',
    json: '#a8a8a8', md: '#ffffff', yml: '#cb171e', yaml: '#cb171e',
    sh: '#89e051', bash: '#89e051', sql: '#e38c00', vue: '#4fc08d',
    svelte: '#ff3e00', php: '#4f5d95', swift: '#f05138', kt: '#7f52ff',
  };
  return colors[ext] || '#71717a';
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
    <div className="flex flex-col h-full">
      <div className="section-header justify-between">
        <div className="flex items-center gap-2.5">
          <FolderTree className="w-4 h-4 text-[var(--accent-light)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Files</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {selectedCount}/{totalCount}
          </span>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => handleToggle(allPaths, !allSelected)}
            className={`tree-checkbox${selectedCount > 0 && !allSelected ? ' indeterminate' : ''}`}
          />
        </div>
      </div>
      <div className="overflow-auto flex-1 max-h-[520px] py-1">
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
