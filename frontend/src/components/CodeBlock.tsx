import { useState, type ReactNode } from 'react';
import { Tabs, theme } from 'antd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from './Mermaid';
import PlantUml from './PlantUml';
import Infographic from './Infographic';

interface CodeBlockProps {
    children?: ReactNode;
    lang?: string;
    block?: boolean;
    className?: string;
    streamStatus?: 'loading' | 'done';
}

type DiagramTabKey = 'preview' | 'source';

const syntaxStyle = {
    margin: 0,
    fontSize: 13,
    borderRadius: 0,
};

/**
 * 统一代码块组件：
 * - 普通代码：语法高亮 + 语言标签 + 复制按钮
 * - 图（mermaid/plantuml/infographic）：Tab 切换「预览 / 源码」，预览看图表，源码看高亮代码
 * - 行内代码直接渲染
 */
export default function CodeBlock({
    children,
    lang = '',
    block = false,
    className,
    streamStatus = 'done',
}: CodeBlockProps) {
    const { token } = theme.useToken();
    const [copied, setCopied] = useState(false);
    const [tabKey, setTabKey] = useState<DiagramTabKey>('preview');

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
    const isInfographic = lang === 'infographic';
    const isDiagram = isMermaid || isPlantUml || isInfographic;

    const sourceView = (
        <SyntaxHighlighter
            language={isInfographic ? 'yaml' : lang || 'text'}
            style={oneDark}
            customStyle={syntaxStyle}
        >
            {text}
        </SyntaxHighlighter>
    );

    // 图代码：用 Tabs 切换 预览/源码
    if (isDiagram) {
        return (
            <div
                style={{
                    margin: '8px 0',
                    borderRadius: token.borderRadiusLG,
                    overflow: 'hidden',
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <Tabs
                    size="small"
                    activeKey={tabKey}
                    onChange={(key) => setTabKey(key as DiagramTabKey)}
                    tabBarExtraContent={{
                        right: (
                            <button
                                onClick={handleCopy}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    color: copied
                                        ? token.colorSuccess
                                        : token.colorInfo,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                }}
                            >
                                {copied ? '已复制' : '复制'}
                            </button>
                        ),
                    }}
                    items={[
                        {
                            key: 'preview',
                            label: '预览',
                            children: (
                                <div
                                    style={{
                                        padding: 12,
                                        background: token.colorFillQuaternary,
                                        minHeight: 60,
                                    }}
                                >
                                    {isMermaid ? (
                                        <Mermaid
                                            chart={text}
                                            streamStatus={streamStatus}
                                        />
                                    ) : isPlantUml ? (
                                        <PlantUml
                                            chart={text}
                                            streamStatus={streamStatus}
                                        />
                                    ) : (
                                        <Infographic
                                            chart={text}
                                            streamStatus={streamStatus}
                                        />
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'source',
                            label: `${lang || 'text'} · 源码`,
                            children: sourceView,
                        },
                    ]}
                />
            </div>
        );
    }

    // 普通代码块：语法高亮 + 头部栏
    return (
        <div
            style={{
                position: 'relative',
                margin: '8px 0',
                borderRadius: 6,
                overflow: 'hidden',
                border: `1px solid ${token.colorBorderSecondary}`,
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
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
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

            {sourceView}
        </div>
    );
}
