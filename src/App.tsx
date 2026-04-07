import { AppRouter } from './app/router';
import { PortalProvider } from './app/providers/PortalProvider';

function App() {
  return (
    <PortalProvider>
      <AppRouter />
    </PortalProvider>
  );
}

export default App;
