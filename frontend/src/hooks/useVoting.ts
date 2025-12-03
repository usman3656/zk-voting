import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, VotingType } from '../config/contract';
import { ensureHardhatNetwork } from '../utils/network';
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
                  votingType = VotingType.YES_NO; // Default to yes/no for old proposals
                  isFinished = false;
                  createdAt = 0n;
                  finishedAt = 0n;
                  console.warn(`Proposal ${i} uses old format - contract may need redeployment`);
                } else if (proposalData.length === 6) {
                  // New contract format: [id, description, votingType, isFinished, createdAt, finishedAt]
                  const votingTypeNum = proposalData[2];
                  [id, description, , isFinished, createdAt, finishedAt] = proposalData;
                  votingType = Number(votingTypeNum) as 0 | 1;
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

                // Load data based on voting type
                if (votingType === VotingType.CANDIDATE_BASED) {
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
                } else if (votingType === VotingType.YES_NO) {
                  try {
                    const [yesCount, noCount] = await votingContract.getYesNoResults(i);
                    proposal.yesCount = yesCount;
                    proposal.noCount = noCount;
                  } catch (e) {
                    console.error(`Error loading yes/no results for proposal ${i}:`, e);
                  }
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
    if (provider && CONTRACT_ADDRESS && account) {
      const initContract = async () => {
        try {
          console.log('Initializing contract...', {
            hasProvider: !!provider,
            contractAddress: CONTRACT_ADDRESS,
            account: account,
          });
          
          // Check network FIRST and try to switch automatically
          const network = await provider.getNetwork();
          console.log('Network info:', {
            chainId: network.chainId.toString(),
            name: network.name,
          });
          
          if (network.chainId !== 31337n) {
            console.log('Wrong network detected. Attempting to switch to Hardhat network...');
            try {
              await ensureHardhatNetwork(provider);
              console.log('✅ Successfully switched to Hardhat network');
              await new Promise(resolve => setTimeout(resolve, 500));
              const newProvider = new BrowserProvider(window.ethereum!);
              const newNetwork = await newProvider.getNetwork();
              if (newNetwork.chainId !== 31337n) {
                throw new Error('Still on wrong network after switch attempt');
              }
            } catch (switchError: any) {
              const errorMsg = switchError.message || `Wrong network! Expected Chain ID 31337 (Hardhat), but connected to Chain ID ${network.chainId.toString()}. Please switch MetaMask to Hardhat Local network manually.`;
              console.error(errorMsg);
              setError(errorMsg);
              setLoading(false);
              return;
            }
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
            setError(`Contract not found. Make sure: 1) You're on Hardhat network (Chain ID: 31337), 2) Contract is deployed, 3) Contract address is correct: ${CONTRACT_ADDRESS}`);
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

  // Create yes/no proposal
  const createYesNoProposal = async (description: string) => {
    if (!contract) throw new Error('Contract not loaded');
    if (!account) throw new Error('Please connect your wallet');
    
    try {
      // First check if function exists by trying to estimate gas
      try {
        await contract.createYesNoProposal.estimateGas(description);
      } catch (estimateError: any) {
        const errorMsg = estimateError.message || String(estimateError);
        if (errorMsg.includes('does not exist') || errorMsg.includes('missing function') || errorMsg.includes('execution reverted')) {
          throw new Error('Contract does not have createYesNoProposal function. Please redeploy the contract with the new code.');
        }
        // If it's a different error (like not owner), let it pass through to the actual call
      }
      
      const tx = await contract.createYesNoProposal(description);
      await tx.wait();
      await refresh();
    } catch (err: any) {
      console.error('Error creating yes/no proposal:', err);
      let message = 'Failed to create yes/no proposal';
      
      if (err.message) {
        message = err.message;
        if (err.message.includes('Only owner')) {
          message = 'Only the contract owner can create proposals. Make sure you are using the owner account.';
        } else if (err.message.includes('does not exist') || err.message.includes('missing function')) {
          message = 'The contract does not have the createYesNoProposal function. Please redeploy the updated contract.';
        } else if (err.message.includes('Internal JSON-RPC error')) {
          message = 'Transaction failed. Possible reasons: 1) You are not the contract owner, 2) Contract needs to be redeployed with new code. Check the console for details.';
        } else if (err.reason) {
          message = err.reason;
        }
      }
      
      throw new Error(message);
    }
  };

  // Legacy createProposal (creates yes/no proposal for backward compatibility)
  const createProposal = async (description: string) => {
    return createYesNoProposal(description);
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

  // Vote yes or no
  const voteYesNo = async (proposalId: bigint, isYes: boolean) => {
    if (!contract) throw new Error('Contract not loaded');
    
    try {
      const tx = await contract.voteYesNo(proposalId, isYes);
      await tx.wait();
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to vote';
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

  // Legacy vote function (backward compatibility)
  const vote = async (proposalId: bigint) => {
    // Legacy vote defaults to "yes" for yes/no proposals
    return voteYesNo(proposalId, true);
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
    createYesNoProposal,
    addVoterToProposal,
    addVotersToProposal,
    voteForCandidate,
    voteYesNo,
    finishVoting,
    // Legacy functions (backward compatibility)
    createProposal,
    vote,
    registerVoter,
    registerVoters,
    hasVoted,
  };
}

