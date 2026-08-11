export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  res.status(404).json({
    error: 'Endpoint non trouve',
    path: req.url,
    message: 'Cet endpoint nexiste pas. Verifiez la documentation API.'
  })
}
