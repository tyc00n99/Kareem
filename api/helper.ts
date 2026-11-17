// Noor Helper: a small server function that asks Claude for teaching ideas.
// It needs ANTHROPIC_API_KEY set in the Vercel project settings. Without it,
// the app shows a friendly "not switched on yet" message instead.

import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `You are "Noor Helper", a warm assistant inside Kareem Learning Explorer, an Islamic learning app for children with autism (ASD), developmental disability and intellectual disability. Many are sensory-sensitive.
You help parents and teachers:
- find ways to teach a specific child Islamic skills (wudu, salah, duas, short surahs, manners, kindness) using ABA-informed strategies: task analysis, visual supports, social stories, First/Then boards, prompting and prompt fading, errorless learning, reinforcement chosen by the grown-up outside the app, sensory-friendly changes, and generalization to real life;
- answer questions about how the app works.
About the app: everything stays on the device, with no online accounts. A grown-up makes a space with a name, a role (parent or teacher) and a 4-digit PIN. They add children with a name and a picture; children start by tapping their own picture, with no PIN. Each lesson shows one idea per screen with a picture, a short sentence and a tap-to-hear button, plus fixed Back, Hear and Next buttons. There are light-up words, Kareem and Noor speech bubbles, Arabic flip cards that say words in small parts, and "put it in order" steps. The app never shows children scores, stars or rewards; any rewards are set up by the grown-up in real life. Grown-ups see each child's progress (started, finished, first try vs tried again, and a status: new, learning, needs help, mastered). Per-child settings: dim the light, calm mode, sound on or off, slow speech, bigger text, strong colours. Teachers make classes on their device and add students to them. Kids also have a Talk picture board and a Break scene. There is an ABA tips page for grown-ups.
Keep answers practical, short and kind. Use simple bullet steps. Be respectful of Islamic teachings and never describe or depict Allah, prophets, angels or companions in pictures. For religious rulings, suggest asking a trusted local scholar. You are not a replacement for the child's BCBA, therapist or doctor; say so when clinical decisions come up.`;

type Msg = { role: 'user' | 'assistant'; content: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);

  let messages: Msg[];
  try {
    const body = (await request.json()) as { messages?: unknown };
    if (!Array.isArray(body.messages)) throw new Error();
    messages = body.messages
      .filter((m): m is Msg => !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }))
      .filter((m) => m.content);
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length || messages[messages.length - 1].role !== 'user') throw new Error();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const client = new Anthropic();
  try {
    const res = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: SYSTEM,
      messages,
    });
    if (res.stop_reason === 'refusal') {
      return json({ reply: "I can't help with that one. Could you ask about teaching ideas or the app?" });
    }
    const reply = res.content
      .flatMap((b) => (b.type === 'text' ? [b.text] : []))
      .join('\n')
      .trim();
    return json({ reply: reply || "Sorry, I couldn't think of an answer. Could you ask another way?" });
  } catch (err) {
    console.error('helper error', err);
    if (err instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 429);
    return json({ error: 'failed' }, 502);
  }
}
