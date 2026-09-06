import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const statusOf = (toolCall) => {
  const status = toolCall.status;
  if (["pending", "running", "in_progress"].includes(status)) {
    return { label: status.replace("_", " "), icon: <Loader2 className="w-3 h-3 animate-spin" />, tone: "text-amber-600" };
  }
  if (["failed", "error"].includes(status)) {
    return { label: "failed", icon: <XCircle className="w-3 h-3" />, tone: "text-destructive" };
  }
  return { label: "done", icon: <CheckCircle2 className="w-3 h-3" />, tone: "text-primary" };
};

function ToolCall({ toolCall }) {
  const [open, setOpen] = useState(false);
  const status = statusOf(toolCall);
  const name = (toolCall.name || "tool").replace(/_/g, " ");
  const projection = toolCall.display_projection;
  const hideDetails = projection?.hide_details && projection?.details_redacted;

  let parsedResults = toolCall.results;
  if (typeof parsedResults === "string") {
    try { parsedResults = JSON.parse(parsedResults); } catch { /* keep raw string */ }
  }
  const resultsFailed = typeof parsedResults === "string" && /error|failed/i.test(parsedResults);
  const effective = resultsFailed
    ? { label: "failed", icon: <XCircle className="w-3 h-3" />, tone: "text-destructive" }
    : status;

  const stateLabel = ["pending", "running", "in_progress"].includes(toolCall.status)
    ? projection?.active_label
    : resultsFailed || ["failed", "error"].includes(toolCall.status)
      ? projection?.error_label
      : projection?.label;

  return (
    <div className="mt-2 text-xs rounded-lg border bg-muted/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left"
      >
        {hideDetails ? null : open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
        <span className={cn("flex items-center gap-1.5 font-medium", effective.tone)}>
          {effective.icon}
          {stateLabel || name}
        </span>
        {!hideDetails && <span className="text-muted-foreground truncate">{name}</span>}
      </button>
      {!hideDetails && open && (
        <div className="px-2.5 pb-2 space-y-1.5">
          {toolCall.arguments_string && (
            <div>
              <p className="text-muted-foreground uppercase text-[10px] tracking-wide">Parameters</p>
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-foreground/80">
                {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 1); } catch { return toolCall.arguments_string; } })()}
              </pre>
            </div>
          )}
          {toolCall.results != null && (
            <div>
              <p className="text-muted-foreground uppercase text-[10px] tracking-wide">Result</p>
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-foreground/80 max-h-48 overflow-y-auto">
                {typeof parsedResults === "string" ? parsedResults : JSON.stringify(parsedResults, null, 1)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-2.5 text-sm space-y-1",
          isUser ? "bg-primary text-primary-foreground" : "bg-card border shadow-sm"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="space-y-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-semibold">
            {message.content || ""}
          </ReactMarkdown>
        )}
        {(message.tool_calls || []).map((toolCall, idx) => (
          <ToolCall key={idx} toolCall={toolCall} />
        ))}
      </div>
    </div>
  );
}