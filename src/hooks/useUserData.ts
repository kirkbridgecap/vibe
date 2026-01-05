export * from '../context/UserDataContext';
// Re-export context hook as the simpler hook for compatibility
// This ensures we don't break existing imports if we just want to execute a quick swap, 
// though we really should update the imports.
import { useUserData as useUserDataContext } from '../context/UserDataContext';
export const useUserData = useUserDataContext;
