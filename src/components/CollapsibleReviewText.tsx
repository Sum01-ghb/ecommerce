"use client";

import { useState } from "react";

interface CollapsibleReviewTextProps {
  content: string;
  charLimit?: number;
}

export default function CollapsibleReviewText({
  content,
  charLimit = 160,
}: CollapsibleReviewTextProps) {
  const [expanded, setExpanded] = useState(false);

  const truncated = content.slice(0, charLimit).trimEnd();
  const displayText = expanded ? content : truncated;

  return (
    <div className="text-caption text-dark-700 leading-relaxed">
      <p>
        {displayText}
        {!expanded && content.length > charLimit && (
          <span aria-hidden="true">…</span>
        )}
      </p>
      {content.length > charLimit && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="
            mt-1 text-footnote font-medium text-dark-700 underline underline-offset-2
            hover:text-dark-900 transition-colors cursor-pointer
            focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
          "
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}