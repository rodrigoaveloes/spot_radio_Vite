import axios from 'axios'

export const Api = {
  TextToSpeech: async (text) => {
    try {
      let headersList = {
        Accept: '*/*',
        // 'User-Agent': 'https://reanimate.com.br',
        'Content-Type': 'application/json'
      }

      let reqOptions = {
        url: 'https://uzyy6uqsnpsy55xlyjs72ifo3e0iufcv.lambda-url.sa-east-1.on.aws/api/textToSpeech',
        method: 'POST',
        headers: headersList,
        data: text
      }
      let response = await axios.request(reqOptions)
      return response.data
    } catch (error) {
      console.error(error)
      return null
    }
  }
}
