import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { connectSocket } from '@/lib/socket'
import { projectKeys } from '@/hooks/useProjects'

const BUILD_STEPS = ['CLONE', 'DOCKERFILE', 'BUILD', 'PUSH', 'DEPLOY']

// Log events are flushed into React state on this interval. A noisy docker build
// can emit 50+ lines a second; without batching that is 50+ renders a second.
const FLUSH_INTERVAL_MS = 100

// Matches the backend's MAX_LOG_LINES cap. Rendering an unbounded list is what
// makes log viewers freeze the tab.
const MAX_LINES = 2000

function emptySteps() {
  return BUILD_STEPS.map((name) => ({ name, status: 'pending', startedAt: null, finishedAt: null }))
}

/**
 * Live build state for one deployment.
 *
 * Two sources feed the same state:
 *  1. A REST fetch on mount seeds steps + logs, so a mid-build refresh (or a
 *     visit long after the build finished) renders complete history.
 *  2. The socket stream applies incremental updates on top.
 *
 * @param {string} projectId
 * @param {string|null} deploymentId
 */
export function useDeploymentStream(projectId, deploymentId) {
  const queryClient = useQueryClient()

  const [logs, setLogs] = useState([])
  const [steps, setSteps] = useState(emptySteps)
  const [status, setStatus] = useState(null)
  const [deployment, setDeployment] = useState(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(Boolean(deploymentId))

  // Log lines not yet committed to state.
  const pendingRef = useRef([])
  const flushTimerRef = useRef(null)

  // The REST seed *replaces* logs, so lines that stream in while it is still in
  // flight would be wiped out. They are held in pendingRef until the seed lands.
  const seededRef = useRef(false)

  const flushPending = useCallback(() => {
    if (pendingRef.current.length === 0) return
    const incoming = pendingRef.current
    pendingRef.current = []
    setLogs((prev) => {
      const next = prev.concat(incoming)
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next
    })
  }, [])

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null
      flushPending()
    }, FLUSH_INTERVAL_MS)
  }, [flushPending])

  // ---- 1. Seed from REST -------------------------------------------------
  useEffect(() => {
    // Switching deployments must reset everything, or the previous build's log
    // tail bleeds into the new view.
    pendingRef.current = []
    seededRef.current = false

    if (!deploymentId) {
      setLogs([])
      setSteps(emptySteps())
      setStatus(null)
      setDeployment(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    api
      .get(`/deployment/${deploymentId}`)
      .then(({ data }) => {
        if (cancelled) return
        const d = data.deployment
        setDeployment(d)
        setLogs((d.logs || []).map((l) => ({ ts: l.ts, line: l.line, stream: l.stream })))
        setSteps(d.steps?.length ? d.steps : emptySteps())
        setStatus(d.status)
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return
        setLoading(false)
        // Release anything the socket delivered during the fetch. The backend
        // batches to Mongo every ~1s, so these lines are newer than the snapshot.
        seededRef.current = true
        flushPending()
      })

    return () => {
      cancelled = true
    }
  }, [deploymentId, flushPending])

  // ---- 2. Room subscription (projectId only, so it survives switching) ----
  useEffect(() => {
    if (!projectId) return

    const socket = connectSocket()

    function handleConnect() {
      setConnected(true)
      // Re-subscribe on every connect, including reconnects — rooms are not
      // preserved across a dropped connection.
      socket.emit('subscribe:project', projectId, (ack) => {
        if (ack && !ack.ok) console.warn('[stream] subscribe rejected:', ack.msg)
      })
    }

    function handleDisconnect() {
      setConnected(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    if (socket.connected) handleConnect()

    return () => {
      socket.emit('unsubscribe:project', projectId)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [projectId])

  // ---- 3. Event handling -------------------------------------------------
  useEffect(() => {
    if (!projectId) return

    const socket = connectSocket()

    function handleEvent(event) {
      // One socket carries every project the user is subscribed to, and a stale
      // deployment's tail can still arrive after switching — filter both.
      if (String(event.projectId) !== String(projectId)) return
      if (deploymentId && String(event.deploymentId) !== String(deploymentId)) return

      if (event.type === 'log') {
        pendingRef.current.push({ ts: event.ts, line: event.line, stream: event.stream })
        if (seededRef.current) scheduleFlush()
        return
      }

      if (event.type === 'step') {
        setSteps((prev) =>
          prev.map((step) =>
            step.name === event.step
              ? {
                  ...step,
                  status: event.status,
                  startedAt: event.status === 'running' ? event.ts : step.startedAt,
                  finishedAt: event.status === 'running' ? null : event.ts,
                }
              : step
          )
        )
        return
      }

      if (event.type === 'status') {
        setStatus(event.status)
        setDeployment((prev) =>
          prev
            ? {
                ...prev,
                status: event.status,
                liveUrl: event.liveUrl ?? prev.liveUrl,
                errorMessage: event.errorMessage ?? prev.errorMessage,
              }
            : prev
        )

        // Keep the dashboard badge and history list honest without a reload.
        queryClient.invalidateQueries({ queryKey: projectKeys.all })
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })

        if (event.status === 'READY' || event.status === 'FAILED') {
          flushPending()
          queryClient.invalidateQueries({ queryKey: projectKeys.deployments(projectId) })
        }
      }
    }

    socket.on('deployment:event', handleEvent)

    return () => {
      socket.off('deployment:event', handleEvent)
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
    }
  }, [projectId, deploymentId, queryClient, flushPending, scheduleFlush])

  return { logs, steps, status, deployment, connected, loading }
}

export { BUILD_STEPS }
