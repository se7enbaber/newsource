import { api } from './apiService';

export const getUsersApi = async (pageNumber: number = 1, pageSize: number = 10) => {
    return api.get(`/api/users?PageNumber=${pageNumber}&PageSize=${pageSize}`);
};

export const createUserApi = async (payload: any) => {
    return api.post('/api/Users', payload);
};

export const updateUserApi = async (id: string, payload: any) => {
    return api.put(`/api/Users/${id}`, payload);
};
export const getUserByIdApi = async (id: string) => {
    return api.get(`/api/Users/${id}`);
};
