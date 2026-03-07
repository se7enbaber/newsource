import { api } from "./apiService";

export interface TenantDto {
    id: string;
    name: string;
    code: string;
    connectionString?: string;
    dbProvider?: string;
    isMigrated: boolean;
    lastMigratedAt?: string;
    features: string[];
    logoUrl?: string;
    createdAt: string;
}

export interface CreateTenantDto {
    name: string;
    code: string;
    connectionString?: string;
    dbProvider?: string;
    features: string[];
    logoUrl?: string;
}

const tenantService = {
    getPaged: async (pageNumber: number, pageSize: number, searchTerm: string = "") => {
        return api.get(`/api/tenants?pageNumber=${pageNumber}&pageSize=${pageSize}&searchTerm=${searchTerm}`);
    },

    getById: async (id: string) => {
        return api.get(`/api/tenants/${id}`);
    },

    create: async (data: CreateTenantDto) => {
        return api.post(`/api/tenants`, data);
    },

    update: async (id: string, data: CreateTenantDto) => {
        return api.put(`/api/tenants/${id}`, data);
    },

    delete: async (id: string) => {
        return api.delete(`/api/tenants/${id}`);
    },

    getAllFeatures: async () => {
        return api.get(`/api/tenants/get_features`);
    },

    migrate: async (id: string) => {
        return api.post(`/api/tenants/${id}/migrate`, {});
    },

    checkConnection: async (connectionString: string, provider: string) => {
        return api.post(`/api/tenants/check-connection`, { connectionString, provider });
    }
};

export default tenantService;
