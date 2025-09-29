const API_BASE = 'https://ctec-api-887035518167.us-central1.run.app'

export const apiConfig = {
  baseUrl: API_BASE,
  endpoints: {
    offeringDetail: (id) => `${API_BASE}/offerings/${id}`,
    instructorProfile: (id) => `${API_BASE}/instructors/${id}/profile`,
  },
}


