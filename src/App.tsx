import { PresentationProvider } from './stores/PresentationContext';
import { OperatorLayout } from './components/layout/OperatorLayout';
import './styles/global.css';

function App() {
  return (
    <PresentationProvider>
      <OperatorLayout />
    </PresentationProvider>
  );
}

export default App;
