import { useState, useEffect } from 'react';

interface AccountInfo {
  address: string;
  privateKey: string;
  balance: string;
  role?: string;
  isOwner?: boolean;
  contractAddress?: string;
}

interface AccountsData {
  accounts: AccountInfo[];
  contractAddress?: string;
  network?: {
    name: string;
    chainId: number;
    rpcUrl: string;
  };
  generatedAt?: string;
}

interface HardhatAccountsProps {
  isOwner: boolean;
}

export function HardhatAccounts({ isOwner }: HardhatAccountsProps) {
  const [accountsData, setAccountsData] = useState<AccountsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        // Try to load from public directory
        const response = await fetch('/hardhat-accounts.json');
        if (response.ok) {
          const data = await response.json();
          setAccountsData(data);
        } else {
          console.warn('Accounts file not found. Make sure to run the setup script first.');
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
    
    // Refresh every 5 seconds to check for updates
    const interval = setInterval(loadAccounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Only show accounts to owner
  if (!isOwner) {
    return null;
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <p>Loading Hardhat accounts...</p>
      </div>
    );
  }

  if (!accountsData || !accountsData.accounts || accountsData.accounts.length === 0) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fff3e0',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '2px solid #FF9800'
      }}>
        <p style={{ margin: 0, color: '#E65100' }}>
          ⚠️ Hardhat accounts not found. Please run the setup script first:
        </p>
        <code style={{
          display: 'block',
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          npm run setup
        </code>
      </div>
    );
  }

  return (
    <div style={{
      border: '2px solid #9C27B0',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#f3e5f5',
      marginBottom: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#7B1FA2' }}>🔑 Hardhat Test Accounts</h2>
        <button
          onClick={() => setShowPrivateKeys(!showPrivateKeys)}
          style={{
            padding: '8px 16px',
            backgroundColor: showPrivateKeys ? '#9C27B0' : '#E1BEE7',
            color: showPrivateKeys ? 'white' : '#7B1FA2',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {showPrivateKeys ? '👁️ Hide' : '👁️ Show'} Private Keys
        </button>
      </div>

      {accountsData.contractAddress && (
        <div style={{
          padding: '12px',
          backgroundColor: '#E1BEE7',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          <strong>Contract Address:</strong> {accountsData.contractAddress}
          <button
            onClick={() => copyToClipboard(accountsData.contractAddress!, -1)}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {copiedIndex === -1 ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {accountsData.network && (
        <div style={{
          padding: '10px',
          backgroundColor: '#E1BEE7',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '13px',
          color: '#666'
        }}>
          <strong>Network:</strong> {accountsData.network.name} (Chain ID: {accountsData.network.chainId})
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {accountsData.accounts.map((account, index) => (
          <div
            key={index}
            style={{
              padding: '15px',
              backgroundColor: account.isOwner ? '#E8F5E9' : 'white',
              borderRadius: '8px',
              border: account.isOwner ? '2px solid #4CAF50' : '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: account.isOwner ? '#2e7d32' : '#333' }}>
                  {account.isOwner ? '👑' : '👤'} Account {index + 1} {account.role && `- ${account.role}`}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {account.balance}
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Address:</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'monospace',
                fontSize: '13px',
                padding: '6px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                wordBreak: 'break-all'
              }}>
                <span style={{ flex: 1 }}>{account.address}</span>
                <button
                  onClick={() => copyToClipboard(account.address, index * 2)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#757575',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {copiedIndex === index * 2 ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {showPrivateKeys && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Private Key:</div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  padding: '6px',
                  backgroundColor: '#ffebee',
                  borderRadius: '4px',
                  wordBreak: 'break-all'
                }}>
                  <span style={{ flex: 1 }}>{account.privateKey}</span>
                  <button
                    onClick={() => copyToClipboard(account.privateKey, index * 2 + 1)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copiedIndex === index * 2 + 1 ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#d32f2f',
                  marginTop: '5px',
                  fontStyle: 'italic'
                }}>
                  ⚠️ Keep private keys secure! Only use these for local testing.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '15px',
        padding: '12px',
        backgroundColor: '#E1BEE7',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#666'
      }}>
        <strong>💡 Tip:</strong> Import these accounts into MetaMask using the private keys to test voting. Account 1 is the contract owner.
      </div>
    </div>
  );
}

