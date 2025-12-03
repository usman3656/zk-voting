import type { Proposal } from '../types/proposal';
import { VotingType } from '../config/contract';

interface ResultsDisplayProps {
  proposal: Proposal;
}

export function ResultsDisplay({ proposal }: ResultsDisplayProps) {
  if (!proposal.isFinished) {
    return null;
  }

  if (proposal.votingType === VotingType.CANDIDATE_BASED) {
    const candidates = proposal.candidates || [];
    const candidateVotes = proposal.candidateVotes || {};
    const winner = proposal.winner;

    // Sort candidates by vote count
    const sortedCandidates = [...candidates].sort((a, b) => {
      const votesA = candidateVotes[a] || 0n;
      const votesB = candidateVotes[b] || 0n;
      if (votesA > votesB) return -1;
      if (votesA < votesB) return 1;
      return 0;
    });

    const totalVotes = proposal.totalVotes || 0n;

    // Check for ties - multiple candidates with the same max votes
    let isTie = false;
    let maxVotes = 0n;
    let tiedCandidates: string[] = [];
    
    if (sortedCandidates.length > 0 && totalVotes > 0n) {
      maxVotes = candidateVotes[sortedCandidates[0]] || 0n;
      tiedCandidates = sortedCandidates.filter(c => (candidateVotes[c] || 0n) === maxVotes);
      isTie = tiedCandidates.length > 1 && maxVotes > 0n;
    }

    return (
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '2px solid #4CAF50'
      }}>
        <h3 style={{ marginTop: 0, color: '#2e7d32', marginBottom: '15px' }}>
          🏆 Results (Total Votes: {totalVotes.toString()})
        </h3>
        
        {isTie ? (
          <div style={{
            padding: '15px',
            backgroundColor: '#fff3e0',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #FF9800',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#E65100', marginBottom: '5px' }}>
              🤝 Tie: {tiedCandidates.length} candidates tied
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              {maxVotes.toString()} votes each
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {tiedCandidates.join(', ')}
            </div>
          </div>
        ) : winner ? (
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #4CAF50',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '5px' }}>
              🏆 Winner: {winner}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {candidateVotes[winner]?.toString() || '0'} votes
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedCandidates.map((candidate, index) => {
            const votes = candidateVotes[candidate] || 0n;
            const percentage = totalVotes > 0n 
              ? (Number(votes) / Number(totalVotes) * 100).toFixed(1)
              : '0';
            const isWinner = !isTie && candidate === winner;
            const isTied = isTie && tiedCandidates.includes(candidate);

            return (
              <div
                key={index}
                style={{
                  padding: '12px',
                  backgroundColor: isWinner ? '#e8f5e9' : isTied ? '#fff3e0' : 'white',
                  borderRadius: '6px',
                  border: isWinner ? '2px solid #4CAF50' : isTied ? '2px solid #FF9800' : '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: (isWinner || isTied) ? 'bold' : 'normal', fontSize: '15px' }}>
                    {index === 0 && isWinner ? '🥇' : index === 1 && !isWinner ? '🥈' : index === 2 && !isWinner ? '🥉' : isTied ? '🤝' : ''} {candidate}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {percentage}% of votes
                  </div>
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: isWinner ? '#2e7d32' : isTied ? '#E65100' : '#333',
                  marginLeft: '15px'
                }}>
                  {votes.toString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    // Yes/No voting results
    const yesCount = proposal.yesCount || 0n;
    const noCount = proposal.noCount || 0n;
    const totalVotes = yesCount + noCount;
    const yesPercentage = totalVotes > 0n ? (Number(yesCount) / Number(totalVotes) * 100).toFixed(1) : '0';
    const noPercentage = totalVotes > 0n ? (Number(noCount) / Number(totalVotes) * 100).toFixed(1) : '0';
    const winner = yesCount > noCount ? 'Yes' : noCount > yesCount ? 'No' : 'Tie';

    return (
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '2px solid #2196F3'
      }}>
        <h3 style={{ marginTop: 0, color: '#1976D2', marginBottom: '15px' }}>
          📊 Results (Total Votes: {totalVotes.toString()})
        </h3>

        <div style={{
          padding: '15px',
          backgroundColor: winner === 'Tie' ? '#fff3e0' : winner === 'Yes' ? '#e8f5e9' : '#ffebee',
          borderRadius: '8px',
          marginBottom: '20px',
          border: `2px solid ${winner === 'Tie' ? '#FF9800' : winner === 'Yes' ? '#4CAF50' : '#f44336'}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: winner === 'Tie' ? '#E65100' : winner === 'Yes' ? '#2e7d32' : '#c62828', marginBottom: '5px' }}>
            {winner === 'Tie' ? '🤝' : winner === 'Yes' ? '✅' : '❌'} Result: {winner}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            border: '2px solid #4CAF50'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2e7d32' }}>✅ Yes</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>{yesCount.toString()} votes</span>
            </div>
            <div style={{
              width: '100%',
              height: '30px',
              backgroundColor: '#c8e6c9',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${yesPercentage}%`,
                height: '100%',
                backgroundColor: '#4CAF50',
                transition: 'width 0.3s'
              }} />
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                {yesPercentage}%
              </span>
            </div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            border: '2px solid #f44336'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#c62828' }}>❌ No</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#c62828' }}>{noCount.toString()} votes</span>
            </div>
            <div style={{
              width: '100%',
              height: '30px',
              backgroundColor: '#ffcdd2',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${noPercentage}%`,
                height: '100%',
                backgroundColor: '#f44336',
                transition: 'width 0.3s'
              }} />
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                {noPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

