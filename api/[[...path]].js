// =============================================
// Vercel Serverless — Point d'entree unique API
// Monte l'application Express complète comme une seule fonction.
// Correge "Unexpected token '<'": toutes les routes /api/* sont servies
// par Express, plus aucun fallback SPA (HTML) sur les endpoints API.
// =============================================
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Charge l'app Express depuis le backend (CommonJS)
const app = require('../backend/src/server.js')

export default function handler(req, res) {
  // Express 4 est un middleware : app(req, res) traite la requête
  return app(req, res)
}
