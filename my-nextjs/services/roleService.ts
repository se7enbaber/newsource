import { api } from './apiService';

export interface RoleDropdownItem {
    name: string;
}

export interface RoleData {
    id: string;
    name: string;
    description?: string;
    isSystemRole?: boolean;
    isActive?: boolean;
    permissions?: string[];
}

export const getRoleDropdownApi = async (): Promise<RoleDropdownItem[]> => {
    return api.get('/api/roles/get_role_dropdown');
};

export const getPermissionsApi = async (): Promise<string[]> => {
    return api.get('/api/roles/get_permissions');
};

export const getRolesApi = async (pageNumber: number = 1, pageSize: number = 10) => {
    return api.get(`/api/roles?PageNumber=${pageNumber}&PageSize=${pageSize}`);
};

export const createRoleApi = async (payload: { name: string; description?: string; isSystemRole?: boolean; isActive?: boolean; permissions?: string[] }) => {
    return api.post('/api/roles', payload);
};

export const updateRoleApi = async (id: string, payload: { name: string; description?: string; isSystemRole?: boolean; isActive?: boolean; permissions?: string[] }) => {
    return api.put(`/api/roles/${id}`, payload);
};

