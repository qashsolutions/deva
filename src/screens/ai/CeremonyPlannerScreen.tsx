import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CeremonyGuide } from '../../components/ai/CeremonyGuide';
import { PreparationChecklist } from '../../components/ai/PreparationChecklist';
import { ChatInterface } from '../../components/ai/ChatInterface';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { ceremonyGuideService } from '../../services/ai/ceremonyGuideService';
import { CeremonyGuide as CeremonyGuideType, ChatMessage } from '../../types/ai';
import { CEREMONY_TYPES } from '../../config/constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate } from '../../utils/formatters';

type RootStackParamList = {
  CeremonyPlanner: { ceremonyType?: string };
  SmartSearch: { query: string };
  BookingFlow: { ceremonyType: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CeremonyPlanner'>;
type RoutePropType = RouteProp<RootStackParamList, 'CeremonyPlanner'>;

export const CeremonyPlannerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { currentUser } = useAuth();
  const { user } = useUser();
  
  const [activeTab, setActiveTab] = useState<'guide' | 'checklist' | 'chat'>('guide');
  const [ceremonyType, setCeremonyType] = useState(route.params?.ceremonyType || '');
  const [ceremonyDate, setCeremonyDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState(user?.location?.city || '');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [guide, setGuide] = useState<CeremonyGuideType | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (ceremonyType) {
      loadCeremonyGuide();
    }
  }, [ceremonyType]);

  const loadCeremonyGuide = async () => {
    setLoading(true);
    try {
      const guideData = await ceremonyGuideService.generateGuide(ceremonyType, {
        location,
        date: ceremonyDate,
        specialRequirements,
      });
      setGuide(guideData);
    } catch (error) {
      console.error('Error loading guide:', error);
      Alert.alert('Error', 'Failed to load ceremony guide');
    } finally {
      setLoading(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    try {
      const response = await ceremonyGuideService.answerCeremonyQuestion(
        message,
        ceremonyType,
        [...chatMessages, newMessage]
      );
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  };

  const handleFindPriests = () => {
    const searchQuery = `${ceremonyType} ceremony ${location} ${
      ceremonyDate ? `on ${formatDate(ceremonyDate, 'MMMM d')}` : ''
    } ${specialRequirements}`.trim();
    
    navigation.navigate('SmartSearch', { query: searchQuery });
  };

  const renderPlanningForm = () => {
    if (guide) return null;
    
    return (
      <ScrollView style={styles.planningForm} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Plan Your Ceremony</Text>
          
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Ceremony Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.ceremonyTypes}
            >
              {Object.entries(CEREMONY_TYPES).map(([key, name]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.ceremonyTypeCard,
                    ceremonyType === key && styles.ceremonyTypeCardActive,
                  ]}
                  onPress={() => setCeremonyType(key)}
                >
                  <Ionicons
                    name="flower"
                    size={24}
                    color={ceremonyType === key ? colors.white : colors.primary}
                  />
                  <Text style={[
                    styles.ceremonyTypeName,
                    ceremonyType === key && styles.ceremonyTypeNameActive,
                  ]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Preferred Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.gray[600]} />
              <Text style={styles.dateText}>
                {ceremonyDate
                  ? formatDate(ceremonyDate, 'MMMM d, yyyy')
                  : 'Select a date'
                }
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={ceremonyDate || new Date()}
                mode="date"
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setCeremonyDate(date);
                }}
              />
            )}
          </View>

          <Input
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="City, State"
            icon="location"
          />

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Special Requirements</Text>
            <TextInput
              style={styles.textArea}
              value={specialRequirements}
              onChangeText={setSpecialRequirements}
              placeholder="Any specific requirements or preferences..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Button
            title="Generate Ceremony Plan"
            onPress={loadCeremonyGuide}
            loading={loading}
            disabled={!ceremonyType}
            fullWidth
            icon="sparkles"
          />
        </Card>
      </ScrollView>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabs}>
      {[
        { key: 'guide', label: 'Guide', icon: 'book' },
        { key: 'checklist', label: 'Checklist', icon: 'checkbox' },
        { key: 'chat', label: 'Ask AI', icon: 'chatbubble' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.key ? colors.primary : colors.gray[600]}
          />
          <Text style={[
            styles.tabLabel,
            activeTab === tab.key && styles.activeTabLabel,
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    if (!guide) return null;
    
    switch (activeTab) {
      case 'guide':
        return (
          <CeremonyGuide
            guide={guide}
            loading={loading}
            onAskQuestion={(question) => {
              setActiveTab('chat');
              if (question) {
                handleChatMessage(question);
              }
            }}
          />
        );
      
      case 'checklist':
        return (
          <PreparationChecklist
            ceremonyId={guide.id}
            preparations={guide.preparations}
            items={guide.items}
            showProgress
          />
        );
      
      case 'chat':
        return (
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            placeholder="Ask about the ceremony..."
            userName={user?.name}
            suggestions={[
              'What should I wear to the ceremony?',
              'Can I take photos during the ceremony?',
              'What if I don\'t have all the required items?',
              'How early should I arrive?',
            ]}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ceremony Planner</Text>
        <TouchableOpacity style={styles.aiIndicator}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {!guide ? (
        renderPlanningForm()
      ) : (
        <>
          <View style={styles.ceremonyInfo}>
            <Text style={styles.ceremonyName}>{guide.title}</Text>
            <View style={styles.ceremonyMeta}>
              {ceremonyDate && (
                <Badge
                  text={formatDate(ceremonyDate, 'MMM d')}
                  variant="secondary"
                  size="small"
                />
              )}
              <Badge
                text={guide.duration}
                variant="primary"
                size="small"
              />
            </View>
          </View>
          
          {renderTabs()}
          
          <View style={styles.content}>
            {renderContent()}
          </View>
          
          <View style={styles.footer}>
            <Button
              title="Find Priests"
              onPress={handleFindPriests}
              icon="search"
              fullWidth
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.small,
  },
  headerTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  aiIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planningForm: {
    flex: 1,
  },
  formCard: {
    margin: spacing.medium,
    padding: spacing.large,
  },
  formTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.large,
  },
  formSection: {
    marginBottom: spacing.large,
  },
  formLabel: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  ceremonyTypes: {
    marginHorizontal: -spacing.small,
  },
  ceremonyTypeCard: {
    alignItems: 'center',
    padding: spacing.medium,
    marginHorizontal: spacing.xsmall,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    minWidth: 100,
  },
  ceremonyTypeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ceremonyTypeName: {
    fontSize: fontSize.small,
    color: colors.text.primary,
    marginTop: spacing.xsmall,
    textAlign: 'center',
  },
  ceremonyTypeNameActive: {
    color: colors.white,
    fontWeight: '600',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    backgroundColor: colors.white,
  },
  dateText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    marginLeft: spacing.small,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    fontSize: fontSize.medium,
    color: colors.text.primary,
    backgroundColor: colors.white,
    minHeight: 80,
  },
  ceremonyInfo: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  ceremonyName: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  ceremonyMeta: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingHorizontal: spacing.medium,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    gap: spacing.xsmall,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});