import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
};

export default function MarkdownMessage({
  content,
}: MarkdownMessageProps) {
  return (
    <div className="markdown-message min-w-0 break-words text-[15px] leading-7 text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-xl font-bold leading-tight text-slate-900 first:mt-0">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 text-lg font-bold leading-snug text-slate-900 first:mt-0">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-bold leading-snug text-slate-900">
              {children}
            </h3>
          ),

          p: ({ children }) => (
            <p className="mb-3 whitespace-normal leading-7 last:mb-0">
              {children}
            </p>
          ),

          ul: ({ children }) => (
            <ul className="mb-4 mt-2 list-disc space-y-1.5 pl-6 marker:text-violet-600">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="mb-4 mt-2 list-decimal space-y-1.5 pl-6 marker:font-semibold marker:text-violet-600">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="pl-1 leading-7">
              {children}
            </li>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="italic text-slate-700">
              {children}
            </em>
          ),

          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-violet-300 pl-4 text-slate-600">
              {children}
            </blockquote>
          ),

          hr: () => (
            <hr className="my-5 border-slate-200" />
          ),

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-violet-700 underline underline-offset-2"
            >
              {children}
            </a>
          ),

          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),

          th: ({ children }) => (
            <th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="border border-slate-200 px-3 py-2 align-top">
              {children}
            </td>
          ),

          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-800">
              {children}
            </code>
          ),
        }}
      >
        {content ?? ""}
      </ReactMarkdown>
    </div>
  );
}