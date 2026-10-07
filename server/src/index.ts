import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { healthRouter } from './routes/health.js'
import { linkPreviewRouter } from './routes/linkPreview.js'
import { songPreviewRouter } from './routes/songPreview.js'

const app = express()
const port = process.env.PORT ?? 4000
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: clientOrigin }))
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/link-preview', linkPreviewRouter)
app.use('/api/song-preview', songPreviewRouter)

app.listen(port, () => {
  console.log(`Loopy API listening on http://localhost:${port}`)
})
