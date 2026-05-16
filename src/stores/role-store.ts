import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvZustandStorage } from '@/lib/mmkv';

export type Role = 'customer' | 'cleaner' | 'agency' | 'admin';

interface RoleState {
  activeRole: Role | null;
  availableRoles: Role[];
  hasOnboarded: boolean;
  setActiveRole: (role: Role) => void;
  setAvailableRoles: (roles: Role[]) => void;
  completeOnboarding: (role: Role) => void;
  reset: () => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      activeRole: null,
      availableRoles: [],
      hasOnboarded: false,
      setActiveRole: (role) => {
        const available = get().availableRoles.includes(role)
          ? get().availableRoles
          : [...get().availableRoles, role];
        set({ activeRole: role, availableRoles: available });
      },
      setAvailableRoles: (roles) => set({ availableRoles: roles }),
      completeOnboarding: (role) =>
        set({
          activeRole: role,
          availableRoles: get().availableRoles.includes(role)
            ? get().availableRoles
            : [...get().availableRoles, role],
          hasOnboarded: true,
        }),
      reset: () => set({ activeRole: null, availableRoles: [], hasOnboarded: false }),
    }),
    {
      name: 'role-store',
      storage: createJSONStorage(() => mmkvZustandStorage),
    },
  ),
);
