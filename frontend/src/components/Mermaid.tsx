import { useEffect, useRef, useState, type CSSProperties } from 'react';
import mermaid from 'mermaid';

// 初始化 mermaid（只执行一次）
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
});

let seq = 0;

interface MermaidProps {
    chart: string;
    /** 流式状态：loading 时不渲染图表，只显示原始代码，避免语法不完整导致报错 */
    streamStatus?: 'loading' | 'done';
    style?: CSSProperties;
}

/**
 * Mermaid 图表渲染组件
 * - 接收 mermaid 语法字符串，渲染为 SVG
 * - 流式过程中（streamStatus='loading'）只显示代码，完成后才渲染图表
 */
export default function Mermaid({ chart, streamStatus = 'done', style }: MermaidProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        // 流式过程中不渲染，等完成后再渲染
        if (streamStatus === 'loading') return;

        let cancelled = false;
        const id = `mermaid-${++seq}`;

        mermaid
            .render(id, chart)
            .then(({ svg: result }) => {
                if (!cancelled) {
                    setSvg(result);
                    setError('');
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(String(err?.message || err));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [chart, streamStatus]);

    // 流式过程中或语法错误时，显示原始代码
    if (streamStatus === 'loading' || error) {
        return (
            <pre
                style={{
                    background: '#f6f8fa',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    overflow: 'auto',
                    ...style,
                }}
            >
                <code>{chart}</code>
            </pre>
        );
    }

    return (
        <div
            ref={containerRef}
            className="mermaid-container"
            style={{ overflow: 'auto', ...style }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
