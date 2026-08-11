import { useState, type ReactNode } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from './Mermaid';
import PlantUml from './PlantUml';

interface CodeBlockProps {
    children?: ReactNode;
    lang?: string;
    block?: boolean;
    className?: string;
    streamStatus?: 'loading' | 'done';
}

/**
 * 统一代码块组件：
 * - 块级代码（含 mermaid/plantuml/普通代码）带语言标签 + 复制按钮 + 语法高亮
 * - 行内代码直接渲染
 */
export default function CodeBlock({
    children,
    lang = '',
    block = false,
    className,
    streamStatus = 'done',
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    // 行内代码不需要复制按钮
    if (!block) {
        return <code className={className}>{children}</code>;
    }

    const text = String(children || '').replace(/\n$/, '');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // 忽略复制失败
        }
    };

    const isMermaid = lang === 'mermaid';
    const isPlantUml = lang === 'plantuml';
    const isDiagram = isMermaid || isPlantUml;

    return (
        <div
            style={{
                position: 'relative',
                margin: '8px 0',
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid #e8e8e8',
            }}
        >
            {/* 头部：语言标签 + 复制按钮 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 12px',
                    background: '#282c34',
                    borderBottom: '1px solid #e8e8e8',
                    fontSize: 12,
                    color: '#aaa',
                }}
            >
                <span>{lang || 'text'}</span>
                <button
                    onClick={handleCopy}
                    style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: copied ? '#52c41a' : '#61dafb',
                        padding: '2px 8px',
                        borderRadius: 4,
                    }}
                >
                    {copied ? '已复制' : '复制'}
                </button>
            </div>

            {/* 内容区 */}
                {isMermaid ? (
                <div style={{ padding: 12, background: '#f6f8fa' }}>
                    <Mermaid chart={text} streamStatus={streamStatus} />
                </div>
                ) : isPlantUml ? (
                <div style={{ padding: 12, background: '#f6f8fa' }}>
                    <PlantUml chart={text} streamStatus={streamStatus} />
                </div>
                ) : (
                <SyntaxHighlighter
                    language={lang || 'text'}
                    style={oneDark}
                    customStyle={{
                        margin: 0,
                        fontSize: 13,
                        borderRadius: 0,
                    }}
                >
                    {text}
                </SyntaxHighlighter>
                )}
        </div>
    );
}
