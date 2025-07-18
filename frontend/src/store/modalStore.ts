import { create } from 'zustand';

interface ModalTypes {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

// Invite Modal Store
const useInviteModalStore = create<ModalTypes>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));

export { useInviteModalStore };