import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CeremonyGuide } from '../../components/ai/CeremonyGuide';
import { ChatInterface } from '../../components/ai/ChatInterface';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { ceremonyGuideService } from '../../services/ai/ceremonyGuideService';
import { CeremonyGuide as CeremonyGuideType, ChatMessage } from '../../types/ai';
import { CEREMONY_TYPES } from '../../config/constants';

type RootStackParamList = {
  CulturalGuide: undefined;
  CeremonyPlanner: { ceremonyType: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CulturalGuide'>;

interface CategoryContent {
  ceremonies: {
    title: string;
    description: string;
    ceremonies: Array<{
      key: string;
      name: string;
      description: string;
      duration: string;
    }>;
  };
  traditions: {
    title: string;
    description: string;
    items: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
  };
  festivals: {
    title: string;
    description: string;
    items: Array<{
      name: string;
      date: string;
      description: string;
      celebration: string;
    }>;
  };
  etiquette: {
    title: string;
    description: string;
    categories: Array<{
      title: string;
      points: string[];
    }>;
  };
}

export const CulturalGuideScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuth();
  const { user } = useUser();
  
  const [activeCategory, setActiveCategory] = useState<'ceremonies' | 'traditions' | 'festivals' | 'etiquette'>('ceremonies');
  const [selectedCeremony, setSelectedCeremony] = useState<string | null>(null);
  const [ceremonyGuide, setCeremonyGuide] = useState<CeremonyGuideType | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const categoryContent: CategoryContent = {
    ceremonies: {
      title: 'Hindu Ceremonies',
      description: 'Learn about various Hindu religious ceremonies and their significance',
      ceremonies: [
        {
          key: 'general_puja',
          name: 'General Puja',
          description: 'Daily worship rituals performed at home or temple',
          duration: '30-60 mins',
        },
        {
          key: 'house_blessing',
          name: 'Griha Pravesh',
          description: 'House warming ceremony for new homes',
          duration: '2-3 hours',
        },
        {
          key: 'wedding',
          name: 'Vivah Sanskar',
          description: 'Traditional Hindu wedding ceremony',
          duration: '3-5 hours',
        },
        {
          key: 'naming_ceremony',
          name: 'Namkaran',
          description: 'Baby naming ceremony',
          duration: '1-2 hours',
        },
        {
          key: 'thread_ceremony',
          name: 'Upanayana',
          description: 'Sacred thread ceremony for boys',
          duration: '2-3 hours',
        },
        {
          key: 'birthday_puja',
          name: 'Janam Din Puja',
          description: 'Birthday blessing ceremony',
          duration: '1 hour',
        },
      ],
    },
    traditions: {
      title: 'Sacred Traditions',
      description: 'Understanding Hindu customs and practices',
      items: [
        {
          title: 'Namaste',
          description: 'Traditional greeting with folded hands, recognizing the divine in others',
          icon: 'hand-right',
        },
        {
          title: 'Tilaka',
          description: 'Sacred mark on forehead representing the third eye',
          icon: 'color-palette',
        },
        {
          title: 'Prasadam',
          description: 'Sacred food offering blessed by the deity',
          icon: 'nutrition',
        },
        {
          title: 'Aarti',
          description: 'Ritual of worship with lamps',
          icon: 'flame',
        },
        {
          title: 'Mantras',
          description: 'Sacred chants and prayers',
          icon: 'musical-notes',
        },
        {
          title: 'Fasting',
          description: 'Spiritual practice of abstaining from food',
          icon: 'time',
        },
      ],
    },
    festivals: {
      title: 'Major Festivals',
      description: 'Celebrate the rich tapestry of Hindu festivals',
      items: [
        {
          name: 'Diwali',
          date: 'October/November',
          description: 'Festival of lights celebrating victory of light over darkness',
          celebration: 'Lighting diyas, fireworks, sweets, Lakshmi puja',
        },
        {
          name: 'Holi',
          date: 'March',
          description: 'Festival of colors celebrating spring and love',
          celebration: 'Playing with colors, music, dance, special foods',
        },
        {
          name: 'Navaratri',
          date: 'September/October',
          description: 'Nine nights celebrating the divine feminine',
          celebration: 'Garba dance, fasting, Durga puja',
        },
        {
          name: 'Ganesh Chaturthi',
          date: 'August/September',
          description: 'Birthday of Lord Ganesha',
          celebration: 'Ganesh idol installation, prayers, visarjan',
        },
      ],
    },
    etiquette: {
      title: 'Temple & Ceremony Etiquette',
      description: 'Respectful practices for religious occasions',
      categories: [
        {
          title: 'Dress Code',
          points: [
            'Wear modest, traditional clothing when possible',
            'Remove shoes before entering temple or ceremony area',
            'Cover head in certain temples (especially for women)',
            'Avoid leather items in religious spaces',
          ],
        },
        {
          title: 'Behavior',
          points: [
            'Maintain silence or speak softly',
            'Turn off mobile phones',
            'Avoid pointing feet towards deities or elders',
            'Use right hand for offerings and receiving prasadam',
          ],
        },
        {
          title: 'Participation',
          points: [
            'Follow the priest\'s instructions',
            'Participate with devotion and respect',
            'Ask questions respectfully if unsure',
            'Accept prasadam graciously',
          ],
        },
      ],
    },
  };

  const loadCeremonyGuide = async (ceremonyKey: string) => {
    setLoading(true);
    try {
      const guide = await ceremonyGuideService.generateGuide(ceremonyKey);
      setCeremonyGuide(guide);
    } catch (error) {
      console.error('Error loading ceremony guide:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCeremonySelect = (ceremonyKey: string) => {
    setSelectedCeremony(ceremonyKey);
    loadCeremonyGuide(ceremonyKey);
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
        'general',
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

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
      contentContainerStyle={styles.categoriesContent}
    >
      {Object.entries(categoryContent).map(([key, content]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.categoryCard,
            activeCategory === key && styles.categoryCardActive,
          ]}
          onPress={() => setActiveCategory(key as any)}
        >
          <Ionicons
            name={
              key === 'ceremonies' ? 'flower' :
              key === 'traditions' ? 'book' :
              key === 'festivals' ? 'color-wand' : 'people'
            }
            size={24}
            color={activeCategory === key ? colors.white : colors.primary}
          />
          <Text style={[
            styles.categoryName,
            activeCategory === key && styles.categoryNameActive,
          ]}>
            {content.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCeremonies = () => {
    const { ceremonies } = categoryContent.ceremonies;
    const filteredCeremonies = searchQuery
      ? ceremonies.filter(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : ceremonies;

    return (
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>{categoryContent.ceremonies.title}</Text>
        <Text style={styles.sectionDescription}>{categoryContent.ceremonies.description}</Text>
        
        {filteredCeremonies.map((ceremony) => (
          <TouchableOpacity
            key={ceremony.key}
            onPress={() => handleCeremonySelect(ceremony.key)}
          >
            <Card style={styles.ceremonyCard}>
              <View style={styles.ceremonyHeader}>
                <View style={styles.ceremonyInfo}>
                  <Text style={styles.ceremonyName}>{ceremony.name}</Text>
                  <Text style={styles.ceremonyDescription}>{ceremony.description}</Text>
                </View>
                <Badge text={ceremony.duration} variant="secondary" size="small" />
              </View>
              
              <View style={styles.ceremonyActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCeremonySelect(ceremony.key)}
                >
                  <Ionicons name="book-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionText}>Learn More</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('CeremonyPlanner', { ceremonyType: ceremony.key })}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionText}>Plan This</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTraditions = () => (
    <View style={styles.contentSection}>
      <Text style={styles.sectionTitle}>{categoryContent.traditions.title}</Text>
      <Text style={styles.sectionDescription}>{categoryContent.traditions.description}</Text>
      
      <View style={styles.traditionsGrid}>
        {categoryContent.traditions.items.map((tradition, index) => (
          <Card key={index} style={styles.traditionCard}>
            <View style={styles.traditionIcon}>
              <Ionicons name={tradition.icon as any} size={28} color={colors.primary} />
            </View>
            <Text style={styles.traditionTitle}>{tradition.title}</Text>
            <Text style={styles.traditionDescription}>{tradition.description}</Text>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderFestivals = () => (
    <View style={styles.contentSection}>
      <Text style={styles.sectionTitle}>{categoryContent.festivals.title}</Text>
      <Text style={styles.sectionDescription}>{categoryContent.festivals.description}</Text>
      
      {categoryContent.festivals.items.map((festival, index) => (
        <Card key={index} style={styles.festivalCard}>
          <View style={styles.festivalHeader}>
            <Text style={styles.festivalName}>{festival.name}</Text>
            <Badge text={festival.date} variant="primary" size="small" />
          </View>
          <Text style={styles.festivalDescription}>{festival.description}</Text>
          <View style={styles.celebrationInfo}>
            <Ionicons name="sparkles" size={16} color={colors.warning} />
            <Text style={styles.celebrationText}>{festival.celebration}</Text>
          </View>
        </Card>
      ))}
    </View>
  );

  const renderEtiquette = () => (
    <View style={styles.contentSection}>
      <Text style={styles.sectionTitle}>{categoryContent.etiquette.title}</Text>
      <Text style={styles.sectionDescription}>{categoryContent.etiquette.description}</Text>
      
      {categoryContent.etiquette.categories.map((category, index) => (
        <Card key={index} style={styles.etiquetteCard}>
          <Text style={styles.etiquetteTitle}>{category.title}</Text>
          {category.points.map((point, pointIndex) => (
            <View key={pointIndex} style={styles.etiquettePoint}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.etiquetteText}>{point}</Text>
            </View>
          ))}
        </Card>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'ceremonies':
        return renderCeremonies();
      case 'traditions':
        return renderTraditions();
      case 'festivals':
        return renderFestivals();
      case 'etiquette':
        return renderEtiquette();
      default:
        return null;
    }
  };

  if (selectedCeremony && ceremonyGuide) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setSelectedCeremony(null);
              setCeremonyGuide(null);
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{ceremonyGuide.title}</Text>
          <View style={styles.placeholder} />
        </View>
        
        <CeremonyGuide
          guide={ceremonyGuide}
          loading={loading}
          onAskQuestion={() => setShowChat(true)}
        />
      </SafeAreaView>
    );
  }

  if (showChat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowChat(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ask About Hindu Culture</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ChatInterface
          messages={chatMessages}
          onSendMessage={handleChatMessage}
          placeholder="Ask about ceremonies, traditions, or customs..."
          userName={user?.name}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cultural Guide</Text>
        <TouchableOpacity onPress={() => setShowChat(true)} style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ceremonies, traditions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {renderCategories()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderContent()}
      </ScrollView>
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
  placeholder: {
    width: 40,
  },
  chatButton: {
    padding: spacing.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    marginHorizontal: spacing.medium,
    marginVertical: spacing.medium,
    paddingHorizontal: spacing.medium,
    borderRadius: borderRadius.medium,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.small,
    paddingLeft: spacing.small,
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  categoriesContainer: {
    marginBottom: spacing.medium,
  },
  categoriesContent: {
    paddingHorizontal: spacing.medium,
    gap: spacing.small,
  },
  categoryCard: {
    alignItems: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    marginRight: spacing.small,
    borderRadius: borderRadius.large,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  categoryCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryName: {
    fontSize: fontSize.small,
    color: colors.text.primary,
    marginTop: spacing.xsmall,
    fontWeight: '600',
  },
  categoryNameActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xlarge,
  },
  contentSection: {
    paddingHorizontal: spacing.medium,
  },
  sectionTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  sectionDescription: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginBottom: spacing.large,
    lineHeight: fontSize.medium * 1.4,
  },
  ceremonyCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  ceremonyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.medium,
  },
  ceremonyInfo: {
    flex: 1,
    marginRight: spacing.medium,
  },
  ceremonyName: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  ceremonyDescription: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  ceremonyActions: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  actionText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  traditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.medium,
  },
  traditionCard: {
    width: '47%',
    padding: spacing.medium,
    alignItems: 'center',
  },
  traditionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  traditionTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  traditionDescription: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: fontSize.small * 1.4,
  },
  festivalCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  festivalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  festivalName: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  festivalDescription: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginBottom: spacing.medium,
    lineHeight: fontSize.medium * 1.4,
  },
  celebrationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  celebrationText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    flex: 1,
  },
  etiquetteCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  etiquetteTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  etiquettePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
    gap: spacing.small,
  },
  etiquetteText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: fontSize.medium * 1.4,
  },
});