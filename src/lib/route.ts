import { useEffect, useState } from 'react';

// Tiny hash router: #/  #/settings  #/learn/<topic>/<screen>  #/done/<topic>

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'helper' }
  | { name: 'learn'; topicId: string; index: number }
  | { name: 'done'; topicId: string };

export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'helper') return { name: 'helper' };
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
    case 'learn':
      return `#/learn/${route.topicId}/${route.index + 1}`;
    case 'done':
      return `#/done/${route.topicId}`;
  }
}

export function go(route: Route): void {
  window.location.hash = href(route);
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
