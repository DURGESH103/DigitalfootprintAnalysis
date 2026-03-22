import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  chatOpen: false,
  activeModal: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
}))
