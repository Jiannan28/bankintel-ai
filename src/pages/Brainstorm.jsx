import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MessageBubble from "@/components/brainstorm/MessageBubble";
import { Plus, Lightbulb, Send, Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const AGENT_NAME = "campaign_brainstorm";

export default function Brainstorm() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.agents.listConversations({ agent_name: AGENT_NAME });
        const list = res?.conversations || res || [];
        setConversations(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!activeConversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsubscribe;
  }, [activeConversation?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const selectConversation = async (conversation) => {
    setActiveConversation(conversation);
    try {
      const full = await base44.agents.getConversation(conversation.id);
      setMessages(full?.messages || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    try {
      let conversation = activeConversation;
      if (!conversation) {
        const res = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: {
            name: `Brainstorm · ${new Date().toLocaleString()}`,
            description: "Campaign idea brainstorm with the AI partner",
          },
        });
        conversation = res?.conversation || res;
        setActiveConversation(conversation);
        setConversations((prev) => [conversation, ...prev]);
      }
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const awaitingReply = messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div className="min-h-[calc(100vh-0px)] flex">
      {/* Conversations panel */}
      <div className="hidden md:flex w-72 shrink-0 flex-col border-r bg-card">
        <div className="p-4 border-b">
          <Button
            onClick={() => {
              setActiveConversation(null);
              setMessages([]);
            }}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4" /> New Brainstorm
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center px-4 py-8">
              No brainstorms yet. Start one below.
            </p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeConversation?.id === conversation.id
                    ? "bg-secondary text-secondary-foreground font-medium"
                    : "hover:bg-secondary/70"
                )}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span className="truncate">
                    {conversation?.metadata?.name || "Brainstorm"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 lg:px-10 py-8 border-b bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading text-2xl text-foreground">Brainstorm Studio</h1>
              <p className="text-sm text-muted-foreground">
                Co-create a unique campaign idea with the AI partner, grounded in trending investment news.
              </p>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-10 py-6 space-y-4">
          {messages.length === 0 && !sending && (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <p className="font-medium text-foreground">Start the brainstorm</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Share a focus product or the segment you have in mind. The AI partner will pull the latest
                trending investment news and shape a unique campaign idea with you, saving it as a draft when
                you approve.
              </p>
            </div>
          )}
          {messages.map((message, idx) => (
            <MessageBubble key={idx} message={message} />
          ))}
          {awaitingReply && (
            <div className="flex justify-start">
              <div className="rounded-xl px-4 py-2.5 bg-card border shadow-sm flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                The AI partner is thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-card/50 px-4 lg:px-10 py-4">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Let's brainstorm a wealth campaign around the latest bond yield news for HNW clients…"
              rows={2}
              className="resize-none"
            />
            <Button onClick={handleSend} disabled={!draft.trim() || sending} size="lg">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Enter to send · Shift+Enter for a new line
          </p>
        </div>
      </div>
    </div>
  );
}