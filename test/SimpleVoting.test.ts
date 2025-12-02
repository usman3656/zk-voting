import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("SimpleVoting", function () {
  let voting: any;
  let owner: any;
  let voter1: any;
  let voter2: any;
  let voter3: any;
  let nonVoter: any;

  beforeEach(async function () {
    // Get signers
    const signers = await ethers.getSigners();
    owner = signers[0];
    voter1 = signers[1];
    voter2 = signers[2];
    voter3 = signers[3];
    nonVoter = signers[4];

    // Deploy contract
    voting = await ethers.deployContract("SimpleVoting");
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should start with zero proposals", async function () {
      expect(await voting.proposalCount()).to.equal(0n);
    });

    it("Should start with zero registered voters", async function () {
      expect(await voting.getVoterCount()).to.equal(0n);
    });
  });

  describe("Voter Registration", function () {
    it("Should allow owner to register a voter", async function () {
      await voting.connect(owner).registerVoter(voter1.address);
      expect(await voting.isRegisteredVoter(voter1.address)).to.be.true;
      expect(await voting.getVoterCount()).to.equal(1n);
    });

    it("Should not allow non-owner to register voters", async function () {
      await expect(
        voting.connect(voter1).registerVoter(voter2.address)
      ).to.be.revertedWith("Only owner can perform this action");
    });

    it("Should not allow registering the same voter twice", async function () {
      await voting.connect(owner).registerVoter(voter1.address);
      await expect(
        voting.connect(owner).registerVoter(voter1.address)
      ).to.be.revertedWith("Voter already registered");
    });

    it("Should allow owner to register multiple voters", async function () {
      const voters = [
        voter1.address,
        voter2.address,
        voter3.address,
      ];
      await voting.connect(owner).registerVoters(voters);
      expect(await voting.getVoterCount()).to.equal(3n);
      expect(await voting.isRegisteredVoter(voter1.address)).to.be.true;
      expect(await voting.isRegisteredVoter(voter2.address)).to.be.true;
      expect(await voting.isRegisteredVoter(voter3.address)).to.be.true;
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow owner to create a proposal", async function () {
      const tx = await voting.connect(owner).createProposal("Should we build a new feature?");
      await expect(tx).to.emit(voting, "ProposalCreated").withArgs(1n, "Should we build a new feature?");
      
      const proposal = await voting.getProposal(1);
      expect(proposal.id).to.equal(1n);
      expect(proposal.description).to.equal("Should we build a new feature?");
      expect(proposal.voteCount).to.equal(0n);
    });

    it("Should not allow non-owner to create proposals", async function () {
      await expect(
        voting.connect(voter1).createProposal("Test proposal")
      ).to.be.revertedWith("Only owner can perform this action");
    });

    it("Should increment proposal count", async function () {
      await voting.connect(owner).createProposal("Proposal 1");
      await voting.connect(owner).createProposal("Proposal 2");
      expect(await voting.proposalCount()).to.equal(2n);
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Register voters
      await voting.connect(owner).registerVoters([
        voter1.address,
        voter2.address,
        voter3.address,
      ]);
      
      // Create a proposal
      await voting.connect(owner).createProposal("Test Proposal");
    });

    it("Should allow registered voters to vote", async function () {
      await expect(voting.connect(voter1).vote(1))
        .to.emit(voting, "VoteCast")
        .withArgs(voter1.address, 1n);
      
      expect(await voting.getVoteCount(1)).to.equal(1n);
      expect(await voting.checkVoteStatus(1, voter1.address)).to.be.true;
    });

    it("Should not allow non-registered voters to vote", async function () {
      await expect(
        voting.connect(nonVoter).vote(1)
      ).to.be.revertedWith("You are not a registered voter");
    });

    it("Should not allow voting for non-existent proposals", async function () {
      await expect(
        voting.connect(voter1).vote(999)
      ).to.be.revertedWith("Proposal does not exist");
    });

    it("Should not allow double voting", async function () {
      await voting.connect(voter1).vote(1);
      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("You have already voted for this proposal");
    });

    it("Should track multiple votes correctly", async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(1);
      
      expect(await voting.getVoteCount(1)).to.equal(3n);
      expect(await voting.checkVoteStatus(1, voter1.address)).to.be.true;
      expect(await voting.checkVoteStatus(1, voter2.address)).to.be.true;
      expect(await voting.checkVoteStatus(1, voter3.address)).to.be.true;
    });
  });

  describe("Results", function () {
    beforeEach(async function () {
      // Register voters
      await voting.connect(owner).registerVoters([
        voter1.address,
        voter2.address,
        voter3.address,
      ]);
      
      // Create proposals
      await voting.connect(owner).createProposal("Proposal A");
      await voting.connect(owner).createProposal("Proposal B");
    });

    it("Should return correct vote counts", async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(2);
      
      expect(await voting.getVoteCount(1)).to.equal(2n);
      expect(await voting.getVoteCount(2)).to.equal(1n);
    });

    it("Should return correct proposal details", async function () {
      const proposal = await voting.getProposal(1);
      expect(proposal.id).to.equal(1n);
      expect(proposal.description).to.equal("Proposal A");
      expect(proposal.voteCount).to.equal(0n);
    });
  });
});

