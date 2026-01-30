import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, Conversation } from '@/types';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  hasHydrated: boolean;

  // Conversation management
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string) => void;
  getCurrentConversation: () => Conversation | null;

  // Message management
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  getMessages: (conversationId: string, limit?: number) => ChatMessage[];

  // Context building
  buildContextPayload: (conversationId: string) => ChatMessage[];

  setHasHydrated: (state: boolean) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      isLoading: true,
      hasHydrated: false,

      createConversation: (title?: string) => {
        const id = `conv-${generateId()}`;
        const newConversation: Conversation = {
          id,
          title: title || 'New Conversation',
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        };

        set((state) => ({
          conversations: [...state.conversations, newConversation],
          currentConversationId: id,
        }));

        return id;
      },

      deleteConversation: (id: string) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },

      setCurrentConversation: (id: string) => {
        set({ currentConversationId: id });
      },

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get();
        return conversations.find((conv) => conv.id === currentConversationId) || null;
      },

      addMessage: (conversationId: string, message: ChatMessage) => {
        const newMessage = {
          ...message,
          id: message.id || `msg-${generateId()}`,
          timestamp: message.timestamp || new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, newMessage],
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },

      updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },

      getMessages: (conversationId: string, limit = 50) => {
        const conversation = get().conversations.find((conv) => conv.id === conversationId);
        if (!conversation) return [];

        // Return last N messages
        return conversation.messages.slice(-limit);
      },

      buildContextPayload: (conversationId: string) => {
        const messages = get().getMessages(conversationId, 50);
        return messages;
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state, isLoading: !state });
      },
    }),
    {
      name: 'hrv-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
