import { AppRouter } from './app/router';
import { PortalProvider } from './app/providers/PortalProvider';
import { PublicStoreProvider } from './app/providers/PublicStoreProvider';

function App() {
  return (
    <PortalProvider>
      <PublicStoreProvider>
        <AppRouter />
      </PublicStoreProvider>
    </PortalProvider>
  );
}

export default App;
