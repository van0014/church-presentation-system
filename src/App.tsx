import { PresentationProvider } from './stores/PresentationContext';
import { OperatorLayout } from './components/layout/OperatorLayout';
import { OutputWindow } from './components/output/OutputWindow';
import './styles/global.css';

function App() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');

  return (
    <PresentationProvider>
      {view === 'main' && <OutputWindow mode="main" />}
      {view === 'stage' && <OutputWindow mode="stage" />}
      {!view && <OperatorLayout />}
    </PresentationProvider>
  );
}

export default App;
