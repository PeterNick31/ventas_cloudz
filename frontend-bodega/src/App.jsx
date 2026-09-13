import React from 'react';
import Semaforo from './components/Semaforo';

function App() {
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 32px' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Bodega Inteligente - Panel de Gestión</h1>
      </header>
      <main>
        <Semaforo />
      </main>
    </div>
  );
}

export default App;