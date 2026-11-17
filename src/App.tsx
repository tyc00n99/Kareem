import { getTopic } from './lib/content';
import { isSignedIn } from './lib/people';
import { useRoute } from './lib/route';
import { Done } from './screens/Done';
import { Home } from './screens/Home';
import { Lesson } from './screens/Lesson';
import { SettingsScreen } from './screens/SettingsScreen';
import { Talk } from './screens/Talk';
import { Break } from './screens/Break';
import { SignIn } from './grown/SignIn';
import { Dashboard } from './grown/Dashboard';
import { ChildPage } from './grown/ChildPage';
import { Tips } from './grown/Tips';
import { HelperChat } from './grown/HelperChat';

export function App() {
  const route = useRoute();
  if (route.name === 'settings') return <SettingsScreen />;
  if (route.name === 'talk') return <Talk />;
  if (route.name === 'break') return <Break />;
  if (route.name === 'signin') return <SignIn key={route.tab} tab={route.tab} />;
  if (route.name === 'grown' || route.name === 'helper' || route.name === 'tips' || route.name === 'child' || route.name === 'ai') {
    // The grown-up area sits behind the PIN chosen on this device.
    if (!isSignedIn()) return <SignIn tab="grown-up" />;
    if (route.name === 'tips') return <Tips />;
    if (route.name === 'ai') return <HelperChat />;
    if (route.name === 'child') return <ChildPage key={route.childId} childId={route.childId} />;
    return <Dashboard />;
  }
  if (route.name === 'learn' || route.name === 'done') {
    const topic = getTopic(route.topicId);
    if (!topic) return <Home />;
    return route.name === 'learn' ? <Lesson topic={topic} index={route.index} /> : <Done topic={topic} />;
  }
  return <Home />;
}
