import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store';

interface GroupContextState {
  selfUid: string;
  groupMembers: string[];
  isOwner: boolean;
  setSelfUid: (uid: string) => void;
  setGroupMembers: (members: string[]) => void;
  setIsOwner: (isOwner: boolean) => void;
  sortedGroupMembers: string[];
  resetGroupState: () => void;
}

const GroupContext = createContext<GroupContextState | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const selfUid = useAppStore((s) => s.chat.selfUid);
  const groupMembers = useAppStore((s) => s.chat.groupMembers) as string[];
  const isOwner = useAppStore((s) => s.chat.isOwner);
  const updateChatState = useAppStore((s) => s.updateChatState);

  const setSelfUid = useCallback((uid: string) => {
    updateChatState({ selfUid: uid });
  }, [updateChatState]);

  const setGroupMembers = useCallback((members: string[]) => {
    updateChatState({ groupMembers: members });
  }, [updateChatState]);

  const setIsOwner = useCallback((owner: boolean) => {
    updateChatState({ isOwner: owner });
  }, [updateChatState]);

  const resetGroupState = useCallback(() => {
    updateChatState({ groupMembers: [], isOwner: false });
  }, [updateChatState]);

  const sortedGroupMembers = useMemo(() => {
    if (!groupMembers?.includes(selfUid)) return groupMembers || [];
    return [selfUid, ...(groupMembers || []).filter((memberId) => memberId !== selfUid)];
  }, [groupMembers, selfUid]);

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <GroupContext.Provider value={{
      selfUid,
      groupMembers,
      isOwner,
      setSelfUid,
      setGroupMembers,
      setIsOwner,
      sortedGroupMembers,
      resetGroupState,
    }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
