import { useWallet } from '../hooks/useWallet';

export function WalletButton() {
  const { account, isConnecting, error, connect, disconnect, isConnected } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && account) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{formatAddress(account)}</span>
        <button onClick={disconnect} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button 
        onClick={connect} 
        disabled={isConnecting}
        style={{ padding: '8px 16px', cursor: isConnecting ? 'wait' : 'pointer' }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
    </div>
  );
}

