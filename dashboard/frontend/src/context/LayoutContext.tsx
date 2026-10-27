import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

const SIDEBAR_HIDDEN_KEY = 'evo:sidebar-hidden'

interface LayoutContextValue {
  sidebarHidden: boolean
  toggleSidebar: () => void
}

const LayoutContext = createContext<LayoutContextValue>({
  sidebarHidden: false,
  toggleSidebar: () => {},
})

function loadHidden(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_HIDDEN_KEY) === '1'
  } catch {
    return false
  }
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarHidden, setSidebarHidden] = useState(loadHidden)

  const toggleSidebar = useCallback(() => {
    setSidebarHidden((prev) => {
      const next = !prev
      try { localStorage.setItem(SIDEBAR_HIDDEN_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }, [])

  return (
    <LayoutContext.Provider value={{ sidebarHidden, toggleSidebar }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}
