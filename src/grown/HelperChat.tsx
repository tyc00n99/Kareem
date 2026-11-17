import { useEffect, useRef, useState } from 'react';
import { load, save } from '../lib/storage';
import { GrownUpShell } from './Shell';

// Noor Helper: chats are kept on this device. Only the chat being asked about
// is sent to the helper service to get an answer.

type Msg = { role: 'user' | 'assistant'; content: string };
type Chat = { id: string; title: string; updated: string; messages: Msg[] };
const KEY = 'deen-steps:chats';

const SUGGESTIONS = [
  'My son gets upset during wudu because of the water. Ideas?',
  'How can I teach Surah Al-Ikhlas to a child who is non-speaking?',
  'How do I set up rewards for my child?',
  'How do teachers add my child to their class?',
];

const ERRORS: Record<string, string> = {
  not_configured: 'Noor Helper is not switched on yet. The app owner needs to add a Claude API key in the website settings. The ABA Tips page works without it.',
  busy: 'Noor Helper is busy right now. Please try again in a minute.',
  offline: 'You seem to be offline. Noor Helper needs the internet; the rest of the app still works.',
  failed: "The helper couldn't answer just now. Please try again.",
};

function loadChats(): Chat[] {
  return load<{ chats: Chat[] }>(KEY, { chats: [] }).chats;
}

/** Turn **bold** and "- " bullets into simple, readable lines. */
function Rich({ text }: { text: string }) {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const bold = (s: string) => s.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));
  const flush = () => {
    if (list.length) out.push(<ul key={out.length}>{list.map((l, i) => <li key={i}>{bold(l)}</li>)}</ul>);
    list = [];
  };
  for (const raw of lines) {
    const l = raw.trim();
    const m = l.match(/^(?:[-*•]|\d+[.)])\s+(.*)/);
    if (m) list.push(m[1]);
    else {
      flush();
      if (l) out.push(<p key={out.length}>{bold(l.replace(/^#+\s*/, ''))}</p>);
    }
  }
  flush();
  return <>{out}</>;
}

export function HelperChat() {
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [openId, setOpenId] = useState<string | null>(chats[0]?.id ?? null);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const open = chats.find((c) => c.id === openId) ?? null;

  const store = (next: Chat[]) => {
    setChats(next);
    save(KEY, { chats: next });
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [open?.messages.length, thinking]);

  const send = async (raw: string) => {
    const content = raw.trim();
    if (!content || thinking) return;
    setError('');
    setText('');
    const now = new Date().toISOString();
    let chat: Chat = open ?? { id: Math.random().toString(36).slice(2, 10), title: content.slice(0, 50), updated: now, messages: [] };
    chat = { ...chat, updated: now, messages: [...chat.messages, { role: 'user', content }] };
    let list = [chat, ...chats.filter((c) => c.id !== chat.id)];
    store(list);
    setOpenId(chat.id);
    setThinking(true);
    try {
      if (!navigator.onLine) throw new Error('offline');
      const res = await fetch('/api/helper', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: chat.messages }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error ?? (res.status === 404 ? 'not_configured' : 'failed'));
      chat = { ...chat, updated: new Date().toISOString(), messages: [...chat.messages, { role: 'assistant', content: data.reply }] };
      list = [chat, ...list.filter((c) => c.id !== chat.id)];
      store(list);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'failed';
      setError(ERRORS[code] ?? ERRORS.failed);
    } finally {
      setThinking(false);
    }
  };

  const remove = (id: string) => {
    store(chats.filter((c) => c.id !== id));
    if (openId === id) setOpenId(null);
  };

  return (
    <GrownUpShell>
      <div className="chat-wrap">
        <aside className="chat-side gu-card">
          <button type="button" className="gu-btn gu-btn-wide" onClick={() => { setOpenId(null); setError(''); }}>
            + New chat
          </button>
          {chats.length === 0 ? (
            <p className="gu-muted chat-none">Your chats will show here. They stay on this device.</p>
          ) : (
            <ul className="chat-list">
              {chats.map((c) => (
                <li key={c.id} className={c.id === openId ? 'on' : ''}>
                  <button type="button" className="chat-pick" onClick={() => { setOpenId(c.id); setError(''); }}>
                    {c.title}
                  </button>
                  <button type="button" className="chat-del" aria-label={`Delete chat: ${c.title}`} onClick={() => remove(c.id)}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="chat-main gu-card" aria-label="Noor Helper chat">
          <header className="chat-head">
            <h1 className="gu-h1"><span aria-hidden>🌙</span> Noor Helper</h1>
            <p className="gu-muted">Ask for teaching ideas for your child or questions about the app.</p>
          </header>

          <div className="chat-log" aria-live="polite">
            {!open || open.messages.length === 0 ? (
              <div className="chat-try">
                <p className="gu-label">Try asking</p>
                <div className="chat-sugs">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="chat-sug" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              open.messages.map((m, i) => (
                <div key={i} className={`msg msg-${m.role}`}>
                  {m.role === 'assistant' && <span className="msg-who"><span aria-hidden>🌙</span> Noor Helper</span>}
                  {m.role === 'assistant' ? <Rich text={m.content} /> : <p>{m.content}</p>}
                </div>
              ))
            )}
            {thinking && <p className="msg msg-assistant msg-thinking">Noor Helper is thinking…</p>}
            {error && <p className="gu-error" role="alert">{error}</p>}
            <div ref={endRef} />
          </div>

          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <textarea
              className="gu-input chat-input"
              rows={2}
              value={text}
              placeholder="Ask about teaching ideas or the app..."
              aria-label="Your question"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(text);
                }
              }}
            />
            <button type="submit" className="gu-btn" disabled={thinking || !text.trim()}>
              Send
            </button>
          </form>
          <p className="chat-note">Noor Helper gives ideas, not medical or religious rulings. Check with your child's BCBA or a trusted scholar. Only the chat you send is shared with the helper service.</p>
        </section>
      </div>
    </GrownUpShell>
  );
}
