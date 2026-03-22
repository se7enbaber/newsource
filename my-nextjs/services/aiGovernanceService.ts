import { api } from "./apiService";

export interface AiUsageLogDto {
    id: string;
    tenantId: string;
    userId?: string;
    modelName: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    timestamp: string;
}

export interface AiQuotaDto {
    tenantId: string;
    monthlyTokenLimit: number;
    monthlyCostLimitUsd: number;
    currentUsedTokens: number;
    currentUsedCostUsd: number;
    lastResetDate: string;
    isBlocked: boolean;
}

export interface UpdateQuotaRequest {
    tenantId: string;
    maxTokens?: number;
    maxCost?: number;
}

const aiGovernanceService = {
    getQuota: async (tenantId: string): Promise<AiQuotaDto> => {
        return await api.get(`/api/AiGovernance/quota/${tenantId}`);
    },
    
    updateQuota: async (payload: UpdateQuotaRequest): Promise<AiQuotaDto> => {
        return await api.post('/api/AiGovernance/config-quota', payload);
    },

    getUsageHistory: async (tenantId: string): Promise<AiUsageLogDto[]> => {
        return await api.get(`/api/AiGovernance/usage-history/${tenantId}`);
    }
};

export default aiGovernanceService;
