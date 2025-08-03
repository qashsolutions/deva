import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { ChatMessage } from '../../types/ai';
import { formatDate } from '../../utils/formatters';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
  showSuggestions?: boolean;
  suggestions?: string[];
  userName?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  loading = false,
  placeholder = 'Type your question...',
  showSuggestions = true,
  suggestions = [
    'What items do I need for the ceremony?',
    'How long will the ceremony take?',
    'What should I wear?',
    'Can I customize the ceremony?',
  ],
  userName,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() && !loading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInputText(suggestion);
    setTimeout(handleSend, 100);
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const showAvatar = index === 0 || messages[index - 1].role !== message.role;
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && showAvatar && (
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
        )}
        
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            !isUser && showAvatar && styles.assistantBubbleWithAvatar,
          ]}
        >
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText,
          ]}>
            {message.content}
          </Text>
          
          <Text style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.assistantTimestamp,
          ]}>
            {formatDate(new Date(message.timestamp), 'h:mm a')}
          </Text>
        </View>
      </View>
    );
  };

  const renderSuggestions = () => {
    if (!showSuggestions || messages.length > 0) return null;
    
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Quick Questions</Text>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionButton}
            onPress={() => handleSuggestion(suggestion)}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderWelcome = () => {
    if (messages.length > 0) return null;
    
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeIcon}>
          <Ionicons name="chatbubbles" size={48} color={colors.primary} />
        </View>
        <Text style={styles.welcomeTitle}>
          {userName ? `Hello ${userName}!` : 'Welcome!'}
        </Text>
        <Text style={styles.welcomeText}>
          I'm here to help answer your questions about Hindu ceremonies and traditions.
          Feel free to ask anything!
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {renderWelcome()}
        {renderSuggestions()}
        
        {messages.map((message, index) => renderMessage(message, index))}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          multiline
          maxHeight={100}
          onFocus={() => setIsTyping(true)}
          onBlur={() => setIsTyping(false)}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() && !loading ? colors.white : colors.gray[400]}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: spacing.medium,
  },
  messageContainer: {
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.medium,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.small,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.medium,
    borderRadius: borderRadius.large,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.small,
  },
  assistantBubble: {
    backgroundColor: colors.gray[100],
    borderBottomLeftRadius: borderRadius.small,
  },
  assistantBubbleWithAvatar: {
    marginLeft: 0,
  },
  messageText: {
    fontSize: fontSize.medium,
    lineHeight: fontSize.medium * 1.4,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: fontSize.xsmall,
    marginTop: spacing.xsmall,
  },
  userTimestamp: {
    color: colors.white + '80',
  },
  assistantTimestamp: {
    color: colors.text.secondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  loadingText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.small,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.large,
    fontSize: fontSize.medium,
    color: colors.text.primary,
    marginRight: spacing.small,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xlarge,
    paddingVertical: spacing.xlarge * 2,
  },
  welcomeIcon: {
    marginBottom: spacing.large,
  },
  welcomeTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  welcomeText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: fontSize.medium * 1.5,
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.large,
  },
  suggestionsTitle: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.medium,
    textTransform: 'uppercase',
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.small,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  suggestionText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    marginLeft: spacing.medium,
    flex: 1,
  },
});