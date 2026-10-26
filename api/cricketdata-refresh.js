import { handleCricketdataRequest } from '../src/server/cricketdata/http.js'

export default async function handler(req, res) {
  req.url = `/api/cricketdata-refresh${req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`
  return handleCricketdataRequest(req, res)
}
