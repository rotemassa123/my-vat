import Router from './router';
import { AppBootstrapProvider } from './contexts/AppBootstrapContext';

function App() {
  return (
    <AppBootstrapProvider>
      <Router />
    </AppBootstrapProvider>
  );
}

export default App;
