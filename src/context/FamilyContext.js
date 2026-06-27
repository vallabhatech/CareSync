import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import API from '../utils/api';

const FamilyContext = createContext(null);

/**
 * FamilyProvider — fetches family members once when the user is authenticated
 * and exposes the list + the currently-selected profile to any child component.
 *
 * selectedMember === null  →  "Myself" (primary user)
 * selectedMember === { _id, name, … }  →  a specific family member
 *
 * The selected profile ID is persisted in sessionStorage so it survives React
 * route changes within the same browser tab.
 */
export function FamilyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMemberState] = useState(() => {
    // Rehydrate from sessionStorage on first render
    try {
      const stored = sessionStorage.getItem('caresync_selected_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Persist selection to sessionStorage whenever it changes
  const setSelectedMember = useCallback((member) => {
    setSelectedMemberState(member);
    try {
      if (member) {
        sessionStorage.setItem('caresync_selected_profile', JSON.stringify(member));
      } else {
        sessionStorage.removeItem('caresync_selected_profile');
      }
    } catch {
      // sessionStorage unavailable — continue silently
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const { data } = await API.get('/api/family');
      const list = Array.isArray(data) ? data : [];
      setMembers(list);

      // If the previously selected member was removed, reset to "Myself"
      setSelectedMemberState((prev) => {
        if (!prev) return null;
        const stillExists = list.some((m) => m._id === prev._id);
        if (!stillExists) {
          sessionStorage.removeItem('caresync_selected_profile');
          return null;
        }
        // Refresh stale name/data from the updated list
        return list.find((m) => m._id === prev._id) ?? null;
      });
    } catch (err) {
      console.error('FamilyContext: failed to load members', err);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadMembers();
    } else {
      setMembers([]);
      setSelectedMember(null);
    }
  }, [isAuthenticated, loadMembers, setSelectedMember]);

  return (
    <FamilyContext.Provider
      value={{ members, loadingMembers, loadMembers, selectedMember, setSelectedMember }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

/** Hook for consuming components. */
export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) {
    throw new Error('useFamily must be used inside a <FamilyProvider>');
  }
  return ctx;
}

export default FamilyContext;
