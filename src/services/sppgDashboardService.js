import api from './api'

export const uploadWeeklyMenuCsv = async (file) => {
  const form = new FormData()
  form.append('file', file)

  return api.post('/menu/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const uploadNutritionCsv = async (file) => {
  const form = new FormData()
  form.append('file', file)

  return api.post('/menu/upload-nutrition', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const createSppgMealDocumentation = async ({
  photo,
  notes,
  productionDate,
  targetSchoolIds,
}) => {
  const form = new FormData()
  form.append('photo', photo)
  form.append('notes', notes)
  form.append('productionDate', productionDate)
  form.append('targetSchoolIds', JSON.stringify(targetSchoolIds))

  return api.post('/sppg/meals/documentation', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getSppgMealDocumentation = () => api.get('/sppg/meals/documentation')
export const getSppgMenus = (sppgId) => api.get(`/menu/${sppgId}`)
export const getCvAnalysis = (docId) => api.get(`/dokumentasi/${docId}/analysis`)
