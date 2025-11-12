/**
 * Query utilities for blockchain interaction
 */
export interface BlockfrostConfig {
    projectId: string;
    network: "mainnet" | "preprod" | "preview";
}
export interface KoiosConfig {
    apiUrl: string;
    network: "mainnet" | "preprod" | "preview";
}
export declare class CampaignQuery {
    private config;
    private queryType;
    constructor(config: BlockfrostConfig | KoiosConfig, type?: "blockfrost" | "koios");
    getCampaignDetails(scriptAddress: string, campaignId: string): Promise<{
        status: string;
        poolAmount: bigint;
        totalClaimed: bigint;
        claimsCount: number;
        merkleRoot: string;
    } | null>;
    getWalletUtxos(address: string): Promise<any[]>;
    getAdaBalance(address: string): Promise<bigint>;
}
//# sourceMappingURL=query.d.ts.map