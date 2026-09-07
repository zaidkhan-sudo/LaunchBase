import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import config from '../config/config.js'
import redisClient from '../config/redis.js'
import Project from '../models/project.js'
import { EVENTS_CHANNEL } from '../services/log.service.js'

let io = null

function roomFor(projectId) {
    return `project:${projectId}`
}

/**
 * Bridge worker output to connected browsers.
 *
 * The build worker is a separate OS process, so it cannot touch these sockets
 * directly. It publishes to Redis instead; this subscriber is the only thing
 * that turns those messages into socket emissions.
 */
function attachRedisBridge() {
    // ioredis puts a connection into subscriber mode, where ordinary commands are
    // rejected. The client used for lpush/brpop cannot be reused here.
    const subscriber = redisClient.duplicate()

    subscriber.on('error', (error) => {
        console.error('[Socket] Redis subscriber error:', error.message)
    })

    subscriber.subscribe(EVENTS_CHANNEL, (error) => {
        if (error) {
            console.error('[Socket] Failed to subscribe to events channel:', error.message)
            return
        }
        console.log(`[Socket] Subscribed to Redis channel '${EVENTS_CHANNEL}'`)
    })

    subscriber.on('message', (channel, message) => {
        if (channel !== EVENTS_CHANNEL) return
        try {
            const payload = JSON.parse(message)
            if (!payload?.projectId) return
            io.to(roomFor(payload.projectId)).emit('deployment:event', payload)
        } catch (error) {
            console.error('[Socket] Failed to relay event:', error.message)
        }
    })

    return subscriber
}

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: config.FRONTEND_URL,
            credentials: true,
        },
    })

    // Same verification as auth.middleware.js, but reading the token from the
    // socket handshake instead of an Authorization header.
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token
            if (!token) return next(new Error('Authentication token missing'))

            const decoded = jwt.verify(token, config.JWT_SECRET)
            socket.userId = decoded.id
            return next()
        } catch (error) {
            return next(new Error('Invalid or expired token'))
        }
    })

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected (user ${socket.userId})`)

        socket.on('subscribe:project', async (projectId, ack) => {
            try {
                // Ownership must be verified before joining. Without this, any
                // authenticated user could join another user's room and read
                // their build logs.
                const project = await Project.findOne({
                    _id: projectId,
                    owner: socket.userId,
                }).select('_id')

                if (!project) {
                    if (typeof ack === 'function') {
                        ack({ ok: false, msg: 'Project not found or unauthorized' })
                    }
                    return
                }

                socket.join(roomFor(projectId))
                console.log(`[Socket] User ${socket.userId} subscribed to project ${projectId}`)
                if (typeof ack === 'function') ack({ ok: true })
            } catch (error) {
                console.error('[Socket] subscribe:project failed:', error.message)
                if (typeof ack === 'function') {
                    ack({ ok: false, msg: 'Failed to subscribe' })
                }
            }
        })

        socket.on('unsubscribe:project', (projectId) => {
            socket.leave(roomFor(projectId))
        })

        socket.on('disconnect', (reason) => {
            console.log(`[Socket] Client disconnected (user ${socket.userId}): ${reason}`)
        })
    })

    attachRedisBridge()

    console.log('[Socket] Socket.IO server initialised')
    return io
}

function getIO() {
    if (!io) throw new Error('Socket.IO has not been initialised yet')
    return io
}

export { initSocket, getIO, roomFor }
