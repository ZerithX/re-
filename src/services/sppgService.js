import api from './api'
export const getAllSPPG = () => api.get('/sppg')
export const getSPPGById = (id) => api.get(`/sppg/${id}`)
export const updateMyProfile = (data) => api.patch('/auth/profile', data)
export const getPublicMapData = () => api.get('/public/peta')
