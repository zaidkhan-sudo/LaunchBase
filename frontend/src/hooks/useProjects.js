import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { isInFlight } from '@/components/StatusBadge'

export const projectKeys = {
  all: ['projects'],
  detail: (id) => ['project', id],
  deployments: (id) => ['project', id, 'deployments'],
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const { data } = await api.get('/project')
      return data.projects
    },
    // Safety net only. Live updates arrive over the socket, but if a build starts
    // in another tab this keeps the list from going stale indefinitely.
    refetchInterval: (query) => {
      const projects = query.state.data
      if (!Array.isArray(projects)) return false
      return projects.some((p) => isInFlight(p.status)) ? 15000 : false
    },
  })
}

export function useProject(projectId) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/project/${projectId}`)
      return data.project
    },
    enabled: Boolean(projectId),
  })
}

export function useDeployments(projectId) {
  return useQuery({
    queryKey: projectKeys.deployments(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/project/${projectId}/deployments`)
      return data.deployments
    },
    enabled: Boolean(projectId),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/project', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useRedeploy(projectId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/project/${projectId}/redeploy`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.deployments(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (projectId) => {
      const { data } = await api.delete(`/project/${projectId}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
