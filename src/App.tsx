import { getTopic } from './lib/content';
import { useRoute } from './lib/route';
import { Done } from './screens/Done';
import { Home } from './screens/Home';
import { Lesson } from './screens/Lesson';
import { SettingsScreen } from './screens/SettingsScreen';

export function App() {
  const route = useRoute();
  if (route.name === 'settings') return <SettingsScreen />;
  if (route.name === 'learn' || route.name === 'done') {
    const topic = getTopic(route.topicId);
    if (!topic) return <Home />;
    return route.name === 'learn' ? <Lesson topic={topic} index={route.index} /> : <Done topic={topic} />;
  }
  return <Home />;
}
