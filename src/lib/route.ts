import { useEffect, useState } from 'react';

// Tiny hash router: #/  #/settings  #/learn/<topic>/<screen>  #/done/<topic>

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'helper' }
  | { name: 'talk' }
  | { name: 'break' }
  | { name: 'signin'; tab: 'grown-up' | 'kid' }
  | { name: 'grown' }
  | { name: 'tips' }
  | { name: 'ai' }
  | { name: 'child'; childId: string }
  | { name: 'plan'; childId: string }
  | { name: 'world'; worldId: string }
  | { name: 'learn'; topicId: string; index: number }
  | { name: 'done'; topicId: string };

export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'helper') return { name: 'grown' };
  if (parts[0] === 'sign-in') return { name: 'signin', tab: parts[1] === 'kid' ? 'kid' : 'grown-up' };
  if (parts[0] === 'grown-up') {
    if (parts[1] === 'tips') return { name: 'tips' };
    if (parts[1] === 'helper') return { name: 'ai' };
    if (parts[1] === 'child' && parts[2]) return parts[3] === 'plan' ? { name: 'plan', childId: parts[2] } : { name: 'child', childId: parts[2] };
    return { name: 'grown' };
  }
  if (parts[0] === 'world' && parts[1]) return { name: 'world', worldId: parts[1] };
  if (parts[0] === 'talk') return { name: 'talk' };
  if (parts[0] === 'break') return { name: 'break' };
  if (parts[0] === 'learn' && parts[1]) {
    const n = Number(parts[2]);
    return { name: 'learn', topicId: parts[1], index: Number.isInteger(n) && n > 0 ? n - 1 : 0 };
  }
  if (parts[0] === 'done' && parts[1]) return { name: 'done', topicId: parts[1] };
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'settings':
      return '#/settings';
    case 'helper':
      return '#/helper';
    case 'signin':
      return route.tab === 'kid' ? '#/sign-in/kid' : '#/sign-in';
    case 'grown':
      return '#/grown-up';
    case 'tips':
      return '#/grown-up/tips';
    case 'ai':
      return '#/grown-up/helper';
    case 'child':
      return `#/grown-up/child/${route.childId}`;
    case 'plan':
      return `#/grown-up/child/${route.childId}/plan`;
    case 'talk':
      return '#/talk';
    case 'break':
      return '#/break';
    case 'world':
      return `#/world/${route.worldId}`;
    case 'learn':
      return `#/learn/${route.topicId}/${route.index + 1}`;
    case 'done':
      return `#/done/${route.topicId}`;
  }
}

export function go(route: Route): void {
  const h = href(route);
  // Same address (for example after signing in on a locked page): just redraw.
  if (window.location.hash === h) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = h;
}

/** After signing in, stay on the grown-up page that was asked for, or open the dashboard. */
export function goGrownUp(): void {
  const here = parse(window.location.hash);
  go(['grown', 'tips', 'child', 'plan', 'ai'].includes(here.name) ? here : { name: 'grown' });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

/** Go back to where the learner was (used by the Talk and Break screens). */
export function goBack(): void {
  if (window.history.length > 1) window.history.back();
  else go({ name: 'home' });
}
