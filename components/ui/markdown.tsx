import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
export default function Markdown({ body }: { body: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target={props.href?.startsWith('/') ? undefined : '_blank'} rel="noreferrer" />
          ),
          img: ({ node, alt = '', ...props }) => <img alt={alt} {...props} loading="lazy" />
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
