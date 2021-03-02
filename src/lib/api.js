import axios from 'axios'
// const eth = 'https://mainnet.infura.io/v3/febcd95a1c534c46a2e098e383698b26'
axios.defaults.baseURL = '/api'
axios.defaults.timeout = 240000
// const a = 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken'
axios.interceptors.response.use((response) => {
  if (Object.keys(response.data).includes('code')) {
    if (response.data.code === 0) {
      return response.data.data
    } else {
      return response.data
    }
  } else if (response.data.type === 'application/octet-stream') {
    return response
  } else {
    return response.data
  }
}, (error) => {
  return Promise.reject(error)
})
export default axios