import { handleCricketdataRequest } from '../src/server/cricketdata/http.js'

export default async function handler(req, res) {
  return handleCricketdataRequest(req, res)
}
