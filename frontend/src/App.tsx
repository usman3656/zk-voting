import { Dashboard } from './components/Dashboard';
import { WalletButton } from './components/WalletButton';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1>🗳️ Simple Voting System</h1>
          <WalletButton />
        </div>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
