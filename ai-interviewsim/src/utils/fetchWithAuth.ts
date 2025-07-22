export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('token')
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    localStorage.removeItem('token')
    alert("Session expired. Please login again.")
    window.location.href = '/signup'
    return Promise.reject(new Error('Unauthorized'))
  }

  return response
}
