import http from 'http'
import app from './src/app.js'
import connectDB from './src/config/db.js'
import config from './src/config/config.js'
import { initSocket } from './src/sockets/index.js'

connectDB()

// Socket.IO needs the underlying HTTP server, so it is created explicitly here
// rather than letting app.listen() create one internally.
const server = http.createServer(app)
initSocket(server)

const PORT = config.PORT || 8000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Accepting frontend origin: ${config.FRONTEND_URL}`)
})
