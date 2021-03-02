import axios from '@/lib/coinApi'
axios.defaults.baseURL = '/coins'
const getMarkets = params => {
  return axios.post('/markets',
    {
      params
    },
    {
      headers: {
        'X-RapidAPI-Key': 'fa57d0cadamshdcf7ce3b65faa00p16eaebjsncf603ba968ae',
        'x-rapidapi-host': 'coingecko.p.rapidapi.com'
      }
    })
}
export {
  getMarkets
}

// axios.post(urlString, {data: data,},{headers: {'Authorization': 'Bearer ' + token,"Cookie" : 'sessionId=' + sessionId + '; recId=' + recId,}})