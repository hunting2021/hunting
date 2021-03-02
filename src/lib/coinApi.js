// import axios from 'axios'
// axios.defaults.baseURL = '/coins'
// axios.defaults.timeout = 240000
// axios.interceptors.response.use((response) => {
//   if (Object.keys(response.data).includes('code')) {
//     if (response.data.code === 0) {
//       return response.data.data
//     } else {
//       return response.data
//     }
//   } else if (response.data.type === 'application/octet-stream') {
//     return response
//   } else {
//     return response.data
//   }
// }, (error) => {
//   return Promise.reject(error)
// })
// export default axios