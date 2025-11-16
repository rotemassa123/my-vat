import { create } from 'zustand';

interface ModalTypes {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

interface MagicLinkModalPayload {
  link: string;
  expiresAt?: string;
  accountName?: string;
  userName?: string;
  userEmail?: string;
  entityName?: string;
  isImpersonating?: boolean;
}

interface MagicLinkModalState {
  isOpen: boolean;
  payload: MagicLinkModalPayload | null;
  openModal: (payload: MagicLinkModalPayload) => void;
  closeModal: () => void;
}

// Invite Modal Store
const useInviteModalStore = create<ModalTypes>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));

// Magic Link Modal Store
const useMagicLinkModalStore = create<MagicLinkModalState>((set) => ({
  isOpen: false,
  payload: null,
  openModal: (payload) =>
    set({
      isOpen: true,
      payload,
    }),
  closeModal: () =>
    set({
      isOpen: false,
      payload: null,
    }),
}));

export { useInviteModalStore, useMagicLinkModalStore };