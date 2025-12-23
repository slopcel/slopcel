'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Eye,
  Edit3
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = 
      value.substring(0, start) + 
      before + textToInsert + after + 
      value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after update
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newValue = 
      value.substring(0, lineStart) + 
      prefix + 
      value.substring(lineStart);
    
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }, [value, onChange]);

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**', 'bold'), title: 'Bold (Ctrl+B)' },
    { icon: Italic, action: () => insertMarkdown('*', '*', 'italic'), title: 'Italic (Ctrl+I)' },
    { icon: Heading1, action: () => insertAtLineStart('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertAtLineStart('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertAtLineStart('### '), title: 'Heading 3' },
    { icon: List, action: () => insertAtLineStart('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertAtLineStart('1. '), title: 'Numbered List' },
    { icon: Quote, action: () => insertAtLineStart('> '), title: 'Quote' },
    { icon: Code, action: () => insertMarkdown('`', '`', 'code'), title: 'Inline Code' },
    { icon: LinkIcon, action: () => insertMarkdown('[', '](url)', 'link text'), title: 'Link' },
    { icon: ImageIcon, action: () => insertMarkdown('![', '](url)', 'alt text'), title: 'Image' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertMarkdown('**', '**', 'bold');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertMarkdown('*', '*', 'italic');
      }
    }
    
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden bg-[#141414]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-800 bg-[#0d0d0d] flex-wrap">
        {toolbarButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={button.action}
              title={button.title}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded transition-colors"
            >
              <Icon size={16} />
            </button>
          );
        })}
        
        <div className="flex-1" />
        
        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          title={isPreview ? 'Edit' : 'Preview'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            isPreview 
              ? 'bg-[#d4a017] text-black' 
              : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
          {isPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor / Preview */}
      {isPreview ? (
        <div className="p-4 min-h-[400px] prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value || '*No content to preview*'}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full min-h-[400px] p-4 bg-transparent text-white font-mono text-sm resize-y focus:outline-none placeholder:text-gray-600"
        />
      )}
    </div>
  );
}

