import { PresentationProvider } from './stores/PresentationContext';
import { OperatorLayout } from './components/layout/OperatorLayout';
import { OutputView } from './components/output/OutputView';
import './styles/global.css';

function App() {
  // Simple hash routing for output windows
  // #/main  → main audience output
  // #/stage → stage monitor
  // default → operator
  const hash = typeof window !== 'undefined' ? window.location.hash : '';

  if (hash === '#/main' || hash === '#main') {
    return (
      <PresentationProvider>
        <OutputView role="main" />
      </PresentationProvider>
    );
  }
  if (hash === '#/stage' || hash === '#stage') {
    return (
      <PresentationProvider>
        <OutputView role="stage" />
      </PresentationProvider>
    );
  }

  return (
    <PresentationProvider>
      <OperatorLayout />
    </PresentationProvider>
  );
}

export default App;
