import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.jsx'
import { wakeBackend } from './services/api'
import './index.css'

// Fired at module load rather than in an effect: it needs to start before React
// mounts, and it must not run twice under StrictMode's double render. Nothing
// awaits it — the analysis request is what reports a real failure. On a free
// Render instance this buys back the ~60s cold start while the user is still
// picking a file.
void wakeBackend()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A resume analysis does not change while the user reads it, and every
      // refetch of the coaching panels costs an LLM request on a tier that
      // allows roughly twenty a minute.
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root is missing from index.html')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
