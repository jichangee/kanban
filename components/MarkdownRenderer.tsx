import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUserMessage?: boolean;
}

export default function MarkdownRenderer({ content, className = '', isUserMessage = false }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const baseTextStyle = isUserMessage
    ? 'text-white prose-invert prose-headings:text-white prose-p:text-white prose-li:text-white prose-code:text-white prose-strong:text-white'
    : 'text-gray-900 prose prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900';

  return (
    <div className={`markdown-content ${baseTextStyle} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义标题样式
          h1: ({ children }) => (
            <h1 className={`text-lg font-bold mb-2 ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-base font-semibold mb-2 mt-3 ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-sm font-medium mb-1 mt-2 ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </h3>
          ),

          // 自定义段落样式
          p: ({ children }) => (
            <p className={`mb-2 text-sm leading-relaxed ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </p>
          ),

          // 自定义列表样式
          ul: ({ children }) => (
            <ul className={`list-disc list-inside mb-2 text-sm ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={`list-decimal list-inside mb-2 text-sm ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={`mb-1 ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </li>
          ),

          // 自定义代码样式
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !className;

            if (isInline) {
              return (
                <code
                  className={`px-1 py-0.5 rounded text-xs font-mono ${
                    isUserMessage
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative group">
                <div className="flex items-center justify-between bg-gray-900 text-gray-100 px-4 py-2 text-xs font-mono rounded-t-md">
                  <span>{language || 'text'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopyCode(String(children))}
                  >
                    {copiedCode === String(children) ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <pre className={`hljs ${className} !mt-0 !rounded-t-none`}>
                  <code {...props}>{children}</code>
                </pre>
              </div>
            );
          },

          // 自定义代码块样式
          pre: ({ children }) => (
            <div className="mb-3 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
              {children}
            </div>
          ),

          // 自定义表格样式
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={`border-b ${isUserMessage ? 'border-white/20' : 'border-gray-200'}`}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className={`divide ${isUserMessage ? 'divide-white/20' : 'divide-gray-200'}`}>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className={isUserMessage ? '' : 'hover:bg-gray-50'}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className={`text-left px-3 py-2 font-medium text-xs ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={`text-left px-3 py-2 text-xs ${isUserMessage ? 'text-white/80' : 'text-gray-600'}`}>
              {children}
            </td>
          ),

          // 自定义强调样式
          strong: ({ children }) => (
            <strong className={`font-semibold ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className={`italic ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
              {children}
            </em>
          ),

          // 自定义链接样式
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs underline ${isUserMessage ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'} transition-colors`}
            >
              {children}
            </a>
          ),

          // 自定义引用样式
          blockquote: ({ children }) => (
            <blockquote className={`border-l-4 pl-3 py-1 mb-2 italic text-sm ${
              isUserMessage
                ? 'border-white/40 text-white/80'
                : 'border-gray-300 text-gray-600'
            }`}>
              {children}
            </blockquote>
          ),

          // 自定义分割线样式
          hr: () => (
            <hr className={`my-3 border-0 h-px ${isUserMessage ? 'bg-white/30' : 'bg-gray-200'}`} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}