import { getImageFileAndStream } from '../services/imageService.js'

export async function getImageById(req, res, next) {
  try {
    const { id } = req.params
    const result = await getImageFileAndStream(id)

    if (!result) {
      return res.status(404).end()
    }

    const { file, stream } = result

    res.setHeader('Content-Type', file.metadata?.contentType || 'application/octet-stream')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    stream.on('error', error => {
      if (!res.headersSent) {
        res.status(404).end()
      } else {
        res.destroy(error)
      }
    })

    stream.pipe(res)
  } catch (error) {
    next(error)
  }
}
