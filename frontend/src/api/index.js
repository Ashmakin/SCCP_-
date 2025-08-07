import axios from 'axios';

 
const apiClient = axios.create({
 
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});
 
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';


 
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);



 
export const register = (data) => apiClient.post('/auth/register', data);
export const login = (credentials) => apiClient.post('/auth/login', credentials);

 
export const getAllCompanies = () => apiClient.get('/admin/companies');
export const verifyCompany = (id) => apiClient.put(`/admin/companies/${id}/verify`);

 
export const getAllUsers = () => apiClient.get('/admin/users');
export const updateUserStatus = (id, isActive) => apiClient.put(`/admin/users/${id}/status`, { is_active: isActive });

 
export const createRfq = (formData) => {
 
    return apiClient.post('/rfqs', formData);
};

export const getRfqs = (params) => {
    return apiClient.get('/rfqs', { params });
};
export const getRfqById = (id) => apiClient.get(`/rfqs/${id}`);
export const getRfqAttachments = (id) => apiClient.get(`/rfqs/${id}/attachments`);

 
export const getQuotesForRfq = (rfqId) => apiClient.get(`/rfqs/${rfqId}/quotes`);
export const createQuote = (rfqId, quoteData) => apiClient.post(`/rfqs/${rfqId}/quotes`, quoteData);
export const acceptQuote = (quoteId) => apiClient.post(`/quotes/${quoteId}/accept`);

 
export const getCompanyProfile = (id) => apiClient.get(`/companies/${id}`);
export const updateCompanyProfile = (id, data) => apiClient.put(`/companies/${id}`, data);


 
export const getOrders = () => apiClient.get('/orders');
export const rateOrder = (orderId, ratings) => apiClient.post(`/orders/${orderId}/rate`, ratings); // <-- 新增
export const updateOrderStatus = (orderId, status) => {
    return apiClient.patch(`/orders/${orderId}/status`, { status });

};
export const getChatHistory = (rfqId) => apiClient.get(`/rfqs/${rfqId}/messages`);

export const getMyProfile = () => apiClient.get('/users/me');
export const changePassword = (data) => apiClient.put('/users/me/password', data);

export const getBuyerStats = () => apiClient.get('/analytics/buyer-stats');
export const getSupplierStats = () => apiClient.get('/analytics/supplier-stats');
export const getSpendingBySupplier = () => apiClient.get('/analytics/spending-by-supplier');

 
export const getAllCapabilities = () => apiClient.get('/capabilities');
export const getCompanyCapabilities = (companyId) => apiClient.get(`/capabilities/company/${companyId}`);
export const addCapabilityToCompany = (capabilityId) => apiClient.post('/capabilities/my-company', { capability_id: capabilityId });
export const removeCapabilityFromCompany = (capabilityId) => apiClient.delete(`/capabilities/my-company/${capabilityId}`);


 
export const createCheckoutSession = (orderId) => apiClient.post(`/orders/${orderId}/create-checkout-session`);
 
 
export const getNotifications = () => apiClient.get('/notifications');
export const markNotificationAsRead = (id) => apiClient.put(`/notifications/${id}/read`);
 
export const markAllNotificationsAsRead = () => apiClient.put('/notifications/read-all');

// --- Annotation API ---
export const getAnnotations = (attachmentId) => apiClient.get(`/attachments/${attachmentId}/annotations`);
export const createAnnotation = (attachmentId, data) => apiClient.post(`/attachments/${attachmentId}/annotations`, data);