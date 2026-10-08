import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { healthRouter } from './routes/health.js'
import { linkPreviewRouter } from './routes/linkPreview.js'
import { songPreviewRouter } from './routes/songPreview.js'
import { pushRouter } from './routes/push.js'
import { startLetterScheduler } from './lib/push.js'

const app = express()
const port = process.env.PORT ?? 4000
// Podés poner varios orígenes separados por coma: http://localhost:5173,http://localhost:5174
const clientOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim())

app.use(cors({ origin: clientOrigins }))
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/link-preview', linkPreviewRouter)
app.use('/api/song-preview', songPreviewRouter)
app.use('/api/push', pushRouter)

app.listen(port, () => {
  console.log(`Loopy API listening on http://localhost:${port}`)
  startLetterScheduler()
})
