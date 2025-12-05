import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, VotingType, TARGET_NETWORK_CONFIG } from '../config/contract';
import { ensureTargetNetwork, checkNetworkSupport } from '../utils/network';
import type { Proposal } from '../types/proposal';

export function useVoting(provider: BrowserProvider | null, account: string | null) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalCount, setProposalCount] = useState<bigint>(0n);
  const [voterCount, setVoterCount] = useState<bigint>(0n);
  const [isOwner, setIsOwner] = useState(false);
  const [isRegisteredVoter, setIsRegisteredVoter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (votingContract: Contract, userAccount: string, contractProvider: BrowserProvider) => {
    if (!votingContract || !userAccount || !contractProvider) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading contract data...', {
        contractAddress: CONTRACT_ADDRESS,
        userAccount: userAccount,
      });
      
      // Load basic data
      const [count, vCount, owner] = await Promise.all([
        votingContract.proposalCount(),
        votingContract.getVoterCount(),
        votingContract.owner(),
      ]);

      console.log('Loaded contract state:', {
        proposalCount: count.toString(),
        voterCount: vCount.toString(),
        owner: owner,
      });

      setProposalCount(count);
      setVoterCount(vCount);
      const isUserOwner = owner.toLowerCase() === userAccount.toLowerCase();
      setIsOwner(isUserOwner);
      console.log('Owner check:', { contractOwner: owner, userAccount, isUserOwner });

      // Check if registered voter (legacy)
      try {
        const registered = await votingContract.isRegisteredVoter(userAccount);
        setIsRegisteredVoter(registered);
        console.log('Voter registration:', { userAccount, isRegistered: registered });
      } catch (e) {
        setIsRegisteredVoter(false);
      }

      // Load all proposals with full details
      if (count > 0n) {
        const proposalPromises = [];
        for (let i = 1n; i <= count; i++) {
          proposalPromises.push(
            (async () => {
              try {
                const proposalData = await votingContract.getProposal(i);
                
                // Handle both old format (3 values) and new format (6 values)
                let id: bigint, description: string, votingType: 0 | 1, isFinished: boolean, createdAt: bigint, finishedAt: bigint;
                
                if (proposalData.length === 3) {
                  // Old contract format: [id, description, voteCount]
                  [id, description] = proposalData;
                  votingType = VotingType.CANDIDATE_BASED; // Default to candidate-based for old proposals
                  isFinished = false;
                  createdAt = 0n;
                  finishedAt = 0n;
                  console.warn(`Proposal ${i} uses old format - contract may need redeployment`);
                } else if (proposalData.length === 6) {
                  // New contract format: [id, description, votingType, isFinished, createdAt, finishedAt]
                  const votingTypeNum = proposalData[2];
                  [id, description, , isFinished, createdAt, finishedAt] = proposalData;
                  votingType = Number(votingTypeNum) as 0 | 1;
                  // Support both CANDIDATE_BASED and ZK_CANDIDATE_BASED
                  if (votingType !== VotingType.CANDIDATE_BASED && votingType !== VotingType.ZK_CANDIDATE_BASED) {
                    console.warn(`Proposal ${i} has unsupported voting type ${votingType}, treating as candidate-based`);
                    votingType = VotingType.CANDIDATE_BASED;
                  }
                } else {
                  console.error(`Proposal ${i} has unexpected format with ${proposalData.length} values`);
                  return null;
                }
                
                const proposal: Proposal = {
                  id,
                  description,
                  votingType,
                  isFinished,
                  createdAt,
                  finishedAt,
                };

                // Load proposal-specific data
                const [canVote, hasVoted, totalVotes, eligibleVoters] = await Promise.all([
                  votingContract.canVoteOnProposalCheck(i, userAccount).catch(() => false),
                  votingContract.checkVoteStatus(i, userAccount).catch(() => false),
                  votingContract.getTotalVoteCount(i).catch(() => 0n),
                  votingContract.getProposalVoters(i).catch(() => [] as string[]),
                ]);

                proposal.canVote = canVote;
                proposal.hasVoted = hasVoted;
                proposal.totalVotes = totalVotes;
                proposal.eligibleVoters = eligibleVoters;
                proposal.eligibleVoterCount = BigInt(eligibleVoters.length);

                // Load ZK-specific data for ZK proposals
                if (Number(votingType) === VotingType.ZK_CANDIDATE_BASED) {
                  try {
                    const [merkleRoot, commitmentsCount] = await Promise.all([
                      votingContract.getProposalMerkleRoot(i),
                      votingContract.getZKVoteCommitmentsCount(i)
                    ]);
                    proposal.merkleRoot = merkleRoot;
                    proposal.zkVoteCommitmentsCount = commitmentsCount;
                  } catch (err) {
                    console.warn('Failed to load ZK proposal data:', err);
                  }
                }

                // Load data based on voting type (candidate-based and ZK)
                  try {
                    const candidates = await votingContract.getProposalCandidates(i);
                    proposal.candidates = candidates;
                    
                    // Load vote counts for each candidate
                    const candidateVotes: { [candidate: string]: bigint } = {};
                    const votePromises = candidates.map(async (candidate: string) => {
                      const votes = await votingContract.getCandidateVoteCount(i, candidate).catch(() => 0n);
                      candidateVotes[candidate] = votes;
                    });
                    await Promise.all(votePromises);
                    proposal.candidateVotes = candidateVotes;

                    // Load winner if finished
                    if (isFinished) {
                      try {
                        const winner = await votingContract.getWinnerCandidate(i);
                        proposal.winner = winner;
                      } catch (e) {
                        console.error(`Error loading winner for proposal ${i}:`, e);
                      }
                    }
                  } catch (e) {
                    console.error(`Error loading candidates for proposal ${i}:`, e);
                }

                // Load voter's choice if they voted
                if (hasVoted) {
                  try {
                    const choice = await votingContract.getVoterChoice(i, userAccount);
                    proposal.voterChoice = choice;
                  } catch (e) {
                    console.error(`Error loading voter choice for proposal ${i}:`, e);
                  }
                }

                return proposal;
              } catch (err) {
                console.error(`Error loading proposal ${i}:`, err);
                return null;
              }
            })()
          );
        }
        
        const proposalResults = await Promise.all(proposalPromises);
        const validProposals = proposalResults.filter((p): p is Proposal => p !== null);
        setProposals(validProposals);
        console.log('Loaded proposals:', validProposals.length);
        
        // Calculate total unique voters across all proposals
        const uniqueVoters = new Set<string>();
        validProposals.forEach(proposal => {
          if (proposal.eligibleVoters) {
            proposal.eligibleVoters.forEach(voter => {
              uniqueVoters.add(voter.toLowerCase());
            });
          }
        });
        const totalUniqueVoters = BigInt(uniqueVoters.size);
        
        // Use proposal-specific voters count if available, otherwise fall back to legacy count
        if (totalUniqueVoters > 0n) {
          setVoterCount(totalUniqueVoters);
          console.log('Total unique voters across all proposals:', totalUniqueVoters.toString());
        }
        // Otherwise keep the legacy count from getVoterCount()
      } else {
        setProposals([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!CONTRACT_ADDRESS) {
      setError('Contract address not configured. Please set VITE_CONTRACT_ADDRESS in frontend/.env file');
      setLoading(false);
      return;
    }

    if (provider && CONTRACT_ADDRESS && account) {
      const initContract = async () => {
        try {
          console.log('Initializing contract...', {
            hasProvider: !!provider,
            contractAddress: CONTRACT_ADDRESS,
            account: account,
            targetNetwork: TARGET_NETWORK_CONFIG?.name,
          });
          
          // Check network FIRST and try to switch automatically
          let network;
          try {
            network = await provider.getNetwork();
          console.log('Network info:', {
            chainId: network.chainId.toString(),
            name: network.name,
          });
          } catch (networkError: any) {
            console.error('Error getting network:', networkError);
            // If we can't get network, it might be a connection issue
            if (networkError.code === 'UNKNOWN_ERROR' || networkError.message?.includes('RPC')) {
              setError('Cannot connect to blockchain. Make sure Hardhat node is running on http://127.0.0.1:8545');
              setLoading(false);
              return;
            }
            throw networkError;
          }
          
          // Check if current network is supported
          const networkCheck = await checkNetworkSupport(provider);
          console.log('Network check:', networkCheck);
          
          // Only enforce target network if TARGET_NETWORK_CONFIG is set
          if (TARGET_NETWORK_CONFIG) {
            if (!networkCheck.supported || network.chainId !== BigInt(TARGET_NETWORK_CONFIG.chainId)) {
              const targetChainId = TARGET_NETWORK_CONFIG.chainId;
              console.log(`Wrong network detected. Attempting to switch to ${TARGET_NETWORK_CONFIG.name} network...`);
            try {
                await ensureTargetNetwork(provider);
                console.log(`✅ Successfully switched to ${TARGET_NETWORK_CONFIG.name} network`);
              await new Promise(resolve => setTimeout(resolve, 500));
              const newProvider = new BrowserProvider(window.ethereum!);
              const newNetwork = await newProvider.getNetwork();
                const expectedChainId = BigInt(TARGET_NETWORK_CONFIG.chainId);
                if (newNetwork.chainId !== expectedChainId) {
                throw new Error('Still on wrong network after switch attempt');
              }
            } catch (switchError: any) {
                const errorMsg = switchError.message || `Wrong network! Expected Chain ID ${targetChainId} (${TARGET_NETWORK_CONFIG.name}), but connected to Chain ID ${network.chainId.toString()}. Please switch MetaMask to the correct network manually.`;
              console.error(errorMsg);
              setError(errorMsg);
              setLoading(false);
              return;
            }
            }
          } else if (!networkCheck.supported) {
            // No target network config, but current network is not supported
            console.warn('Current network is not in supported list, but continuing anyway...');
          }
          
          // Check if contract exists
          const code = await provider.getCode(CONTRACT_ADDRESS);
          if (!code || code === '0x' || code === '0x0' || code.length <= 2) {
            const errorMsg = `No contract found at address ${CONTRACT_ADDRESS} on this network. The contract may not be deployed, or you're on the wrong network. Expected Chain ID: 31337 (Hardhat).`;
            console.error(errorMsg);
            setError(errorMsg);
            setLoading(false);
            return;
          }
          console.log(`✅ Contract code exists (${code.length} bytes)`);
          
          const signer = await provider.getSigner();
          const votingContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          setContract(votingContract);
          await loadData(votingContract, account, provider);
        } catch (err) {
          console.error('Error initializing contract:', err);
          const errorMsg = err instanceof Error ? err.message : 'Failed to initialize contract';
          
          if (errorMsg.includes('could not decode result data') || errorMsg.includes('value="0x"')) {
            const targetNetwork = TARGET_NETWORK_CONFIG?.name || 'target network';
            const targetChainId = TARGET_NETWORK_CONFIG?.chainId || 'unknown';
            setError(`Contract not found. Make sure: 1) You're on ${targetNetwork} network (Chain ID: ${targetChainId}), 2) Contract is deployed, 3) Contract address is correct: ${CONTRACT_ADDRESS}`);
          } else {
            setError(errorMsg);
          }
          setLoading(false);
        }
      };
      initContract();
    } else {
      if (!CONTRACT_ADDRESS) {
        console.warn('CONTRACT_ADDRESS is not set. Please set VITE_CONTRACT_ADDRESS in .env file');
        setError('Contract address not configured. Please set VITE_CONTRACT_ADDRESS in .env file');
      }
      setLoading(false);
    }
  }, [provider, account, loadData]);

  const refresh = useCallback(() => {
    if (contract && account && provider) {
      loadData(contract, account, provider);
    }
  }, [contract, account, provider, loadData]);

  // Create candidate-based proposal
  const createCandidateProposal = async (description: string, candidates: string[]) => {
    if (!contract) throw new Error('Contract not loaded');
    if (!account) throw new Error('Please connect your wallet');
    
    try {
      // First check if function exists by trying to estimate gas
      try {
        await contract.createCandidateProposal.estimateGas(description, candidates);
      } catch (estimateError: any) {
        const errorMsg = estimateError.message || String(estimateError);
        if (errorMsg.includes('does not exist') || errorMsg.includes('missing function') || errorMsg.includes('execution reverted')) {
          throw new Error('Contract does not have createCandidateProposal function. Please redeploy the contract with the new code.');
        }
        // If it's a different error (like not owner), let it pass through to the actual call
      }
      
      const tx = await contract.createCandidateProposal(description, candidates);
      await tx.wait();
      await refresh();
    } catch (err: any) {
      console.error('Error creating candidate proposal:', err);
      let message = 'Failed to create candidate proposal';
      
      if (err.message) {
        message = err.message;
        // Check for common revert reasons
        if (err.message.includes('Only owner')) {
          message = 'Only the contract owner can create proposals. Make sure you are using the owner account.';
        } else if (err.message.includes('does not exist') || err.message.includes('missing function')) {
          message = 'The contract does not have the createCandidateProposal function. Please redeploy the updated contract.';
        } else if (err.message.includes('Internal JSON-RPC error')) {
          message = 'Transaction failed. Possible reasons: 1) You are not the contract owner, 2) Contract needs to be redeployed with new code, 3) Invalid candidate data. Check the console for details.';
        } else if (err.reason) {
          message = err.reason;
        }
      }
      
      throw new Error(message);
    }
  };

  // Legacy createProposal (deprecated - no longer supported)
  const createProposal = async (_description: string) => {
    throw new Error('createProposal is deprecated. Use createCandidateProposal with at least one candidate.');
  };

  // Create ZK proposal
  const createZKProposal = async (description: string, candidates: string[], merkleRoot: string) => {
    if (!contract) throw new Error('Contract not loaded');
    if (!account) throw new Error('Please connect your wallet');
    
    try {
      // Estimate gas first to catch function existence errors early
      try {
        await contract.createZKProposal.estimateGas(description, candidates, merkleRoot);
      } catch (estimateError: any) {
        const errorMsg = estimateError.message || String(estimateError);
        if (errorMsg.includes('does not exist') || errorMsg.includes('missing function') || errorMsg.includes('execution reverted')) {
          throw new Error('Contract does not have createZKProposal function. Please redeploy the contract with the new code.');
        }
      }
      
      const tx = await contract.createZKProposal(description, candidates, merkleRoot);
      await tx.wait();
      
      // Get the new proposal ID (contract increments proposalCount before returning)
      const newProposalCount = await contract.proposalCount();
      await refresh();
      
      return newProposalCount; // Return the new proposal ID
    } catch (err: any) {
      console.error('Error creating ZK proposal:', err);
      let message = err.message || String(err);
      if (err.message && err.message.includes('does not have')) {
        message = 'The contract does not have the createZKProposal function. Please redeploy the updated contract.';
      } else if (err.message && err.message.includes('Internal JSON-RPC error')) {
        message = 'Transaction failed. Possible reasons: 1) You are not the contract owner, 2) Contract needs to be redeployed with new code, 3) Invalid candidate data or merkle root. Check the console for details.';
        } else if (err.reason) {
          message = err.reason;
        }
      throw new Error(message);
    }
  };

  // Add voter to specific proposal
  const addVoterToProposal = async (proposalId: bigint, voterAddress: string) => {
    if (!contract) throw new Error('Contract not loaded');
    
    try {
      const tx = await contract.addVoterToProposal(proposalId, voterAddress);
      await tx.wait();
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add voter to proposal';
      throw new Error(message);
    }
  };

  // Add multiple voters to specific proposal
  const addVotersToProposal = async (proposalId: bigint, voterAddresses: string[]) => {
    if (!contract) throw new Error('Contract not loaded');
    
    try {
      const tx = await contract.addVotersToProposal(proposalId, voterAddresses);
      await tx.wait();
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add voters to proposal';
      throw new Error(message);
    }
  };

  // Vote for a candidate
  const voteForCandidate = async (proposalId: bigint, candidateName: string) => {
    if (!contract) throw new Error('Contract not loaded');
    
    try {
      const tx = await contract.voteForCandidate(proposalId, candidateName);
      await tx.wait();
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to vote for candidate';
      throw new Error(message);
    }
  };

  // Finish voting (owner only)
  const finishVoting = async (proposalId: bigint) => {
    if (!contract) throw new Error('Contract not loaded');
    
    try {
      const tx = await contract.finishVoting(proposalId);
      await tx.wait();
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to finish voting';
      throw new Error(message);
    }
  };

  // Legacy vote function (deprecated - no longer supported)
  const vote = async (_proposalId: bigint) => {
    throw new Error('vote is deprecated. Use voteForCandidate with a candidate name.');
  };

  // Check if has voted
  const hasVoted = async (proposalId: bigint): Promise<boolean> => {
    if (!contract || !account) return false;
    
    try {
      return await contract.checkVoteStatus(proposalId, account);
    } catch {
      return false;
    }
  };

  // Legacy voter registration (backward compatibility)
  const registerVoter = async (voterAddress: string) => {
    if (!contract) throw new Error('Contract not loaded');
    
    try {
      const tx = await contract.registerVoter(voterAddress);
      await tx.wait();
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register voter';
      throw new Error(message);
    }
  };

  const registerVoters = async (voterAddresses: string[]) => {
    if (!contract) throw new Error('Contract not loaded');
    
    try {
      const tx = await contract.registerVoters(voterAddresses);
      await tx.wait();
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register voters';
      throw new Error(message);
    }
  };

  return {
    contract,
    proposals,
    proposalCount,
    voterCount,
    isOwner,
    isRegisteredVoter,
    loading,
    error,
    refresh,
    // New functions
    createCandidateProposal,
    createZKProposal,
    addVoterToProposal,
    addVotersToProposal,
    voteForCandidate,
    finishVoting,
    // Legacy functions (backward compatibility)
    createProposal,
    vote,
    registerVoter,
    registerVoters,
    hasVoted,
  };
}

