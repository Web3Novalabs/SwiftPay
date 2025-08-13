import { RpcProvider, Contract, Account, cairo } from 'starknet';
import { logger } from '../utils/logger';

export interface GroupMember {
  addr: string;
  percentage: number;
}

export interface Group {
  id: string;
  name: string;
  amount: string;
  isPaid: boolean;
  creator: string;
}

export interface GroupUpdateRequest {
  groupId: string;
  newName: string;
  newAmount: string;
  requester: string;
  feePaid: boolean;
  approvalCount: number;
  isCompleted: boolean;
}

export class StarkNetService {
  private provider: RpcProvider;
  private contract: Contract;
  private account?: Account;

  constructor() {
    const rpcUrl = process.env.STARKNET_RPC_URL || 'https://alpha-mainnet.starknet.io';
    const contractAddress = process.env.AUTOSHARE_CONTRACT_ADDRESS;
    
    this.provider = new RpcProvider({ nodeUrl: rpcUrl });
    
    if (!contractAddress || contractAddress === '0x0') {
      logger.warn('⚠️  AUTOSHARE_CONTRACT_ADDRESS not set or invalid, StarkNet service will be in read-only mode');
      // Create a dummy contract for development
      this.contract = new Contract(
        this.getContractABI(),
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        this.provider
      );
    } else {
      this.contract = new Contract(
        this.getContractABI(),
        contractAddress,
        this.provider
      );
    }

    logger.info('✅ StarkNet service initialized');
  }

  private getContractABI(): any[] {
    // This would be the actual ABI from your compiled contract
    // For now, we'll define the main functions we need
    return [
      {
        name: 'create_group',
        type: 'function',
        inputs: [
          { name: 'name', type: 'core::byte_array::ByteArray' },
          { name: 'amount', type: 'core::integer::u256' },
          { name: 'members', type: 'Array<core::starknet::contract_address::ContractAddress>' },
          { name: 'token_address', type: 'core::starknet::contract_address::ContractAddress' }
        ],
        outputs: []
      },
      {
        name: 'get_group',
        type: 'function',
        inputs: [{ name: 'group_id', type: 'core::integer::u256' }],
        outputs: [{ name: 'group', type: 'Group' }]
      },
      {
        name: 'get_all_groups',
        type: 'function',
        inputs: [],
        outputs: [{ name: 'groups', type: 'Array<Group>' }]
      },
      {
        name: 'pay',
        type: 'function',
        inputs: [{ name: 'group_id', type: 'core::integer::u256' }],
        outputs: []
      },
      {
        name: 'request_group_update',
        type: 'function',
        inputs: [
          { name: 'group_id', type: 'core::integer::u256' },
          { name: 'new_name', type: 'core::byte_array::ByteArray' },
          { name: 'new_amount', type: 'core::integer::u256' },
          { name: 'new_members', type: 'Array<GroupMember>' }
        ],
        outputs: []
      },
      {
        name: 'approve_group_update',
        type: 'function',
        inputs: [{ name: 'group_id', type: 'core::integer::u256' }],
        outputs: []
      },
      {
        name: 'execute_group_update',
        type: 'function',
        inputs: [{ name: 'group_id', type: 'core::integer::u256' }],
        outputs: []
      }
    ];
  }

  // Set account for transactions
  setAccount(privateKey: string, accountAddress: string): void {
    this.account = new Account(this.provider, accountAddress, privateKey);
    this.contract.connect(this.account);
    logger.info('✅ Account connected to contract');
  }

  // Get group by ID
  async getGroup(groupId: string): Promise<Group | null> {
    try {
      const result = await this.contract.get_group(groupId);
      return this.parseGroup(result);
    } catch (error) {
      logger.error('Error getting group:', error);
      return null;
    }
  }

  // Get all groups
  async getAllGroups(): Promise<Group[]> {
    try {
      const result = await this.contract.get_all_groups();
      return result.map((group: any) => this.parseGroup(group));
    } catch (error) {
      logger.error('Error getting all groups:', error);
      return [];
    }
  }

  // Get groups by payment status
  async getGroupsByPaid(isPaid: boolean): Promise<Group[]> {
    try {
      const result = await this.contract.get_groups_by_paid(isPaid);
      return result.map((group: any) => this.parseGroup(group));
    } catch (error) {
      logger.error('Error getting groups by paid status:', error);
      return [];
    }
  }

  // Get group members
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const result = await this.contract.get_group_member(groupId);
      return result.map((member: any) => ({
        addr: member.addr,
        percentage: member.percentage
      }));
    } catch (error) {
      logger.error('Error getting group members:', error);
      return [];
    }
  }

  // Get groups for a specific address
  async getAddressGroups(address: string): Promise<Group[]> {
    try {
      const result = await this.contract.get_address_groups(address);
      return result.map((group: any) => this.parseGroup(group));
    } catch (error) {
      logger.error('Error getting address groups:', error);
      return [];
    }
  }

  // Create group (requires account)
  async createGroup(
    name: string,
    amount: string,
    members: GroupMember[],
    tokenAddress: string
  ): Promise<string | null> {
    if (!this.account) {
      throw new Error('Account not set. Call setAccount() first.');
    }

    try {
      const result = await this.contract.create_group(
        name,
        amount,
        members,
        tokenAddress
      );
      
      logger.info('Group creation transaction submitted:', result);
      return result.transaction_hash;
    } catch (error) {
      logger.error('Error creating group:', error);
      return null;
    }
  }

  // Pay group (requires account)
  async payGroup(groupId: string): Promise<string | null> {
    if (!this.account) {
      throw new Error('Account not set. Call setAccount() first.');
    }

    try {
      const result = await this.contract.pay(groupId);
      
      logger.info('Group payment transaction submitted:', result);
      return result.transaction_hash;
    } catch (error) {
      logger.error('Error paying group:', error);
      return null;
    }
  }

  // Request group update (requires account)
  async requestGroupUpdate(
    groupId: string,
    newName: string,
    newAmount: string,
    newMembers: GroupMember[]
  ): Promise<string | null> {
    if (!this.account) {
      throw new Error('Account not set. Call setAccount() first.');
    }

    try {
      const result = await this.contract.request_group_update(
        groupId,
        newName,
        newAmount,
        newMembers
      );
      
      logger.info('Group update request submitted:', result);
      return result.transaction_hash;
    } catch (error) {
      logger.error('Error requesting group update:', error);
      return null;
    }
  }

  // Approve group update (requires account)
  async approveGroupUpdate(groupId: string): Promise<string | null> {
    if (!this.account) {
      throw new Error('Account not set. Call setAccount() first.');
    }

    try {
      const result = await this.contract.approve_group_update(groupId);
      
      logger.info('Group update approval submitted:', result);
      return result.transaction_hash;
    } catch (error) {
      logger.error('Error approving group update:', error);
      return null;
    }
  }

  // Execute group update (requires account)
  async executeGroupUpdate(groupId: string): Promise<string | null> {
    if (!this.account) {
      throw new Error('Account not set. Call setAccount() first.');
    }

    try {
      const result = await this.contract.execute_group_update(groupId);
      
      logger.info('Group update execution submitted:', result);
      return result.transaction_hash;
    } catch (error) {
      logger.error('Error executing group update:', error);
      return null;
    }
  }

  // Parse group from contract response
  private parseGroup(groupData: any): Group {
    return {
      id: groupData.id.toString(),
      name: groupData.name,
      amount: groupData.amount.toString(),
      isPaid: groupData.usage_limit_reached,
      creator: groupData.creator
    };
  }

  // Get transaction status
  async getTransactionStatus(txHash: string): Promise<any> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      logger.error('Error getting transaction status:', error);
      return null;
    }
  }

  // Get latest block number
  async getLatestBlockNumber(): Promise<number> {
    try {
      const block = await this.provider.getBlockNumber();
      return block;
    } catch (error) {
      logger.error('Error getting latest block number:', error);
      return 0;
    }
  }
}

export const starknetService = new StarkNetService(); 