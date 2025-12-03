import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useVoting } from '../hooks/useVoting';
import { ProposalCard } from './ProposalCard';
import { CreateCandidateProposal } from './CreateCandidateProposal';
import { CreateYesNoProposal } from './CreateYesNoProposal';
import { HardhatAccounts } from './HardhatAccounts';

export function Dashboard() {
  const { account, provider } = useWallet();
  const {
    proposals,
    proposalCount,
    voterCount,
    isOwner,
    isRegisteredVoter,
    loading,
    error,
    refresh,
    createCandidateProposal,
    createYesNoProposal,
    addVoterToProposal,
    addVotersToProposal,
    voteForCandidate,
    voteYesNo,
    finishVoting,
  } = useVoting(provider, account);

  const [votingProposalId, setVotingProposalId] = useState<bigint | null>(null);

  if (!account) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h1>🗳️ Advanced Voting System</h1>
        <p>Please connect your wallet to get started</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading contract data...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>🗳️ Advanced Voting System</h1>
        
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #ef5350'
          }}>
            <strong>⚠️ Error:</strong> {error}
            {error.includes('Contract address') && (
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                Make sure you have set <code>VITE_CONTRACT_ADDRESS</code> in your <code>.env</code> file.
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            flex: '1',
            minWidth: '150px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Proposals</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976D2' }}>
              {proposalCount.toString()}
            </div>
          </div>
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            flex: '1',
            minWidth: '150px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Unique Voters</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
              {voterCount.toString()}
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
              (Across all proposals)
            </div>
          </div>
          <div style={{
            padding: '15px 20px',
            backgroundColor: isOwner ? '#fff3e0' : isRegisteredVoter ? '#e8f5e9' : '#fce4ec',
            borderRadius: '8px',
            flex: '1',
            minWidth: '150px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Your Status</div>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: isOwner ? '#f57c00' : isRegisteredVoter ? '#2e7d32' : '#c2185b'
            }}>
              {isOwner ? '👑 Owner' : isRegisteredVoter ? '✓ Voter' : '👤 Not Registered'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hardhat Accounts Display - Owner Only */}
      {isOwner && <HardhatAccounts isOwner={isOwner} />}
      
      {/* Create Proposal Sections - Always visible to owners */}
      {isOwner && (
        <>
          <CreateCandidateProposal
            onCreateProposal={createCandidateProposal}
            isOwner={isOwner}
          />
          <CreateYesNoProposal
            onCreateProposal={createYesNoProposal}
            isOwner={isOwner}
          />
        </>
      )}

      {/* Admin Panel for legacy voter registration - HIDDEN */}
      {/* {isOwner && (
        <AdminPanel
          onRegisterVoter={registerVoter}
          onRegisterVoters={registerVoters}
        />
      )} */}

      {/* Proposals List */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{
          fontSize: '24px',
          marginBottom: '20px',
          color: '#333',
          borderBottom: '2px solid #2196F3',
          paddingBottom: '10px'
        }}>
          📋 All Proposals
        </h2>
        {proposals.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            color: '#666'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>No proposals yet.</p>
            {isOwner && (
              <p style={{ fontSize: '14px' }}>Create your first proposal using the forms above! ✨</p>
            )}
          </div>
        ) : (
          <div>
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id.toString()}
                proposal={proposal}
                onVoteForCandidate={async (candidateName) => {
                  setVotingProposalId(proposal.id);
                  try {
                    await voteForCandidate(proposal.id, candidateName);
                  } finally {
                    setVotingProposalId(null);
                  }
                }}
                onVoteYesNo={async (isYes) => {
                  setVotingProposalId(proposal.id);
                  try {
                    await voteYesNo(proposal.id, isYes);
                  } finally {
                    setVotingProposalId(null);
                  }
                }}
                onFinishVoting={async () => {
                  await finishVoting(proposal.id);
                }}
                onAddVoter={async (voterAddress) => {
                  await addVoterToProposal(proposal.id, voterAddress);
                }}
                onAddVoters={async (voterAddresses) => {
                  await addVotersToProposal(proposal.id, voterAddresses);
                }}
                isOwner={isOwner}
                isLoading={votingProposalId === proposal.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button
          onClick={refresh}
          style={{
            padding: '10px 24px',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
