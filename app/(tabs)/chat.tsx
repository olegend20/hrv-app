import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useChatStore } from '@/stores/chatStore';
import { useUserStore } from '@/stores/userStore';
import { useHealthProfileStore } from '@/stores/healthProfileStore';
import { useHrvStore } from '@/stores/hrvStore';
import { useHabitStore } from '@/stores/habitStore';
import { ChatMessage } from '@/types';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const profile = useUserStore((state) => state.profile);
  const healthProfile = useHealthProfileStore((state) => state.healthProfile);
  const readings = useHrvStore((state) => state.readings);
  const habits = useHabitStore((state) => state.entries);

  const {
    conversations,
    currentConversationId,
    createConversation,
    getCurrentConversation,
    addMessage,
  } = useChatStore();

  const currentConversation = getCurrentConversation();

  // Create initial conversation if none exists
  useEffect(() => {
    if (!currentConversationId && conversations.length === 0) {
      createConversation('Health Coach Chat');
    }
  }, [currentConversationId, conversations.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [currentConversation?.messages.length]);

  const buildContextPayload = () => {
    // Calculate current HRV stats
    let hrvStats = null;
    if (readings.length > 0) {
      const recentReadings = readings.slice(-7);
      const avg7Day =
        recentReadings.reduce((sum, r) => sum + r.hrvMs, 0) / recentReadings.length;
      const avg30Day =
        readings.slice(-30).reduce((sum, r) => sum + r.hrvMs, 0) /
        Math.min(readings.length, 30);
      const currentHRV = readings[readings.length - 1].hrvMs;

      hrvStats = {
        current: Math.round(currentHRV),
        avg7Day: Math.round(avg7Day),
        avg30Day: Math.round(avg30Day),
        percentile: calculatePercentile(currentHRV, profile?.age || 40),
        trend: currentHRV > avg7Day ? 'increasing' : 'decreasing',
      };
    }

    // Get recent habits (last 7 days)
    const recentHabits = habits.slice(-7);

    return {
      userProfile: profile,
      healthProfile,
      hrvStats,
      recentHabits,
      correlations: [], // Would come from correlation analysis
      goals: {
        targetHRV: profile?.targetPercentile || 50,
        targetPercentile: profile?.targetPercentile || 50,
      },
    };
  };

  const calculatePercentile = (hrv: number, age: number): number => {
    // Simplified percentile calculation
    if (age < 30) {
      if (hrv >= 70) return 75;
      if (hrv >= 60) return 50;
      return 25;
    } else if (age < 50) {
      if (hrv >= 60) return 75;
      if (hrv >= 50) return 50;
      return 25;
    } else {
      if (hrv >= 50) return 75;
      if (hrv >= 40) return 50;
      return 25;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !currentConversationId) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    // Add user message to conversation
    addMessage(currentConversationId, userMessage);

    // Clear input
    const messageCopy = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Build context
      const context = buildContextPayload();

      // Get conversation history
      const conversationHistory = currentConversation?.messages || [];

      // Call streaming chat API
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageCopy,
            conversationId: currentConversationId,
            context,
            conversationHistory: conversationHistory.slice(-10), // Last 10 messages
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantContent = '';
      const assistantMessageId = `msg-${Date.now()}`;

      // Add empty assistant message that we'll update
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      addMessage(currentConversationId, assistantMessage);

      // Stream the response
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                assistantContent += data.token;
                // Update the message content
                useChatStore.setState((state) => ({
                  conversations: state.conversations.map((conv) =>
                    conv.id === currentConversationId
                      ? {
                          ...conv,
                          messages: conv.messages.map((msg) =>
                            msg.id === assistantMessageId
                              ? { ...msg, content: assistantContent }
                              : msg
                          ),
                        }
                      : conv
                  ),
                }));
              }
              if (data.done) {
                break;
              }
            } catch (e) {
              // Ignore parse errors for partial data
            }
          }
        }
      }

      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      addMessage(currentConversationId, errorMessage);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleNewConversation = () => {
    createConversation(`Chat ${new Date().toLocaleDateString()}`);
  };

  const handleQuickReply = (text: string) => {
    setInputText(text);
  };

  const quickReplies = [
    'Suggest a workout for today',
    'How can I improve my sleep?',
    'Why is my HRV low today?',
    'Plan my meals for better recovery',
  ];

  if (!currentConversation) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No conversation yet</Text>
        <TouchableOpacity style={styles.button} onPress={handleNewConversation}>
          <Text style={styles.buttonText}>Start New Chat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Health Coach</Text>
        <TouchableOpacity onPress={handleNewConversation}>
          <Text style={styles.newChatButton}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Context Pills */}
      <View style={styles.contextPills}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {readings.length > 0 && (
            <View style={styles.contextPill}>
              <Text style={styles.contextPillText}>
                📊 {readings.length} days of HRV data
              </Text>
            </View>
          )}
          {healthProfile && (
            <View style={styles.contextPill}>
              <Text style={styles.contextPillText}>
                🎯 Goal: {healthProfile.primaryGoal}
              </Text>
            </View>
          )}
          {habits.length > 0 && (
            <View style={styles.contextPill}>
              <Text style={styles.contextPillText}>
                💪 {habits.length} habit entries
              </Text>
            </View>
          )}
          {profile && (
            <View style={styles.contextPill}>
              <Text style={styles.contextPillText}>
                👤 Age {profile.age}, {profile.gender}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleNewConversation}
            title="Pull to start new conversation"
          />
        }
      >
        {currentConversation.messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeEmoji}>💬</Text>
            <Text style={styles.welcomeTitle}>Hi! I'm your AI Health Coach</Text>
            <Text style={styles.welcomeText}>
              I can help you optimize your HRV through personalized advice. Ask me
              anything!
            </Text>
          </View>
        )}

        {currentConversation.messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === 'user'
                ? styles.userBubble
                : styles.assistantBubble,
            ]}
          >
            {message.role === 'assistant' ? (
              <Markdown style={markdownStyles}>{message.content}</Markdown>
            ) : (
              <Text style={styles.messageText}>{message.content}</Text>
            )}
          </View>
        ))}

        {isTyping && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Reply Suggestions */}
      {currentConversation.messages.length === 0 && !inputText && (
        <View style={styles.quickRepliesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyButton}
                onPress={() => handleQuickReply(reply)}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything..."
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  newChatButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contextPills: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contextPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contextPillText: {
    fontSize: 12,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickReplyButton: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  quickReplyText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

const markdownStyles = {
  body: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  paragraph: {
    marginBottom: 8,
  },
  strong: {
    fontWeight: '600',
  },
  em: {
    fontStyle: 'italic',
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
  },
};
