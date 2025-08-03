import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { CeremonyGuide as CeremonyGuideType } from '../../types/ai';

interface CeremonyGuideProps {
  guide: CeremonyGuideType | null;
  loading?: boolean;
  onAskQuestion?: (question: string) => void;
}

export const CeremonyGuide: React.FC<CeremonyGuideProps> = ({
  guide,
  loading,
  onAskQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'preparations' | 'items' | 'faqs'>('overview');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Preparing your ceremony guide...</Text>
      </View>
    );
  }

  if (!guide) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No guide available</Text>
      </View>
    );
  }

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'overview', label: 'Overview', icon: 'information-circle' },
        { key: 'preparations', label: 'Prepare', icon: 'list' },
        { key: 'items', label: 'Items', icon: 'basket' },
        { key: 'faqs', label: 'FAQs', icon: 'help-circle' },
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
            activeTab === tab.key && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flower" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>About This Ceremony</Text>
        </View>
        <Text style={styles.description}>{guide.description}</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={colors.gray[600]} />
          <Text style={styles.infoText}>Duration: {guide.duration}</Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={24} color={colors.warning} />
          <Text style={styles.sectionTitle}>Significance</Text>
        </View>
        <Text style={styles.description}>{guide.significance}</Text>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={styles.sectionTitle}>Do's</Text>
        </View>
        {guide.dosDonts.dos.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="close-circle" size={24} color={colors.error} />
          <Text style={styles.sectionTitle}>Don'ts</Text>
        </View>
        {guide.dosDonts.donts.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Ionicons name="close" size={16} color={colors.error} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </Card>

      {guide.culturalNotes.length > 0 && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe" size={24} color={colors.info} />
            <Text style={styles.sectionTitle}>Cultural Notes</Text>
          </View>
          {guide.culturalNotes.map((note, index) => (
            <View key={index} style={styles.noteItem}>
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );

  const renderPreparations = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {['spiritual', 'physical', 'material', 'dietary'].map(category => {
        const items = guide.preparations.filter(p => p.category === category);
        if (items.length === 0) return null;

        return (
          <Card key={category} style={styles.section}>
            <Text style={styles.categoryTitle}>
              {category.charAt(0).toUpperCase() + category.slice(1)} Preparations
            </Text>
            {items.map((prep, index) => (
              <View key={index} style={styles.prepItem}>
                <View style={styles.prepHeader}>
                  <Text style={styles.prepTitle}>{prep.title}</Text>
                  {prep.required && (
                    <Badge text="Required" variant="error" size="small" />
                  )}
                </View>
                <Text style={styles.prepDescription}>{prep.description}</Text>
                <View style={styles.timeline}>
                  <Ionicons name="calendar-outline" size={14} color={colors.gray[600]} />
                  <Text style={styles.timelineText}>{prep.timeline}</Text>
                </View>
              </View>
            ))}
          </Card>
        );
      })}
    </ScrollView>
  );

  const renderItems = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {guide.items.map((item, index) => (
        <Card key={index} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Badge text={item.quantity.toString()} variant="primary" size="small" />
          </View>
          
          <Text style={styles.itemDescription}>{item.description}</Text>
          
          {item.alternatives && item.alternatives.length > 0 && (
            <View style={styles.alternatives}>
              <Text style={styles.alternativesLabel}>Alternatives:</Text>
              {item.alternatives.map((alt, i) => (
                <Text key={i} style={styles.alternativeText}>• {alt}</Text>
              ))}
            </View>
          )}
          
          <View style={styles.itemFooter}>
            {item.whereToGet && (
              <View style={styles.whereToGet}>
                <Ionicons name="location-outline" size={14} color={colors.gray[600]} />
                <Text style={styles.whereToGetText}>{item.whereToGet}</Text>
              </View>
            )}
            {item.estimatedCost && (
              <Text style={styles.cost}>{item.estimatedCost}</Text>
            )}
          </View>
        </Card>
      ))}
    </ScrollView>
  );

  const renderFAQs = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {guide.faqs.map((faq, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => setExpandedFAQ(expandedFAQ === faq.question ? null : faq.question)}
        >
          <Card style={styles.faqCard}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Ionicons
                name={expandedFAQ === faq.question ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.gray[600]}
              />
            </View>
            
            {expandedFAQ === faq.question && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                <Badge
                  text={faq.category}
                  variant="secondary"
                  size="small"
                  style={styles.faqCategory}
                />
              </View>
            )}
          </Card>
        </TouchableOpacity>
      ))}
      
      {onAskQuestion && (
        <TouchableOpacity
          style={styles.askButton}
          onPress={() => onAskQuestion('')}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={styles.askButtonText}>Ask a Question</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{guide.title}</Text>
      </View>
      
      {renderTabs()}
      
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'preparations' && renderPreparations()}
        {activeTab === 'items' && renderItems()}
        {activeTab === 'faqs' && renderFAQs()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  title: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
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
  section: {
    marginBottom: spacing.medium,
    padding: spacing.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    gap: spacing.small,
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  description: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.5,
    marginBottom: spacing.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  infoText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
    gap: spacing.small,
  },
  listText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    flex: 1,
  },
  categoryTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  prepItem: {
    marginBottom: spacing.medium,
    paddingBottom: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  prepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  prepTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  prepDescription: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  timelineText: {
    fontSize: fontSize.small,
    color: colors.gray[600],
  },
  itemCard: {
    marginBottom: spacing.small,
    padding: spacing.medium,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  itemName: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemDescription: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  alternatives: {
    marginBottom: spacing.small,
  },
  alternativesLabel: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  alternativeText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.small,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whereToGet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  whereToGetText: {
    fontSize: fontSize.small,
    color: colors.gray[600],
  },
  cost: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.primary,
  },
  faqCard: {
    marginBottom: spacing.small,
    padding: spacing.medium,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  faqAnswer: {
    marginTop: spacing.medium,
  },
  faqAnswerText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    lineHeight: fontSize.medium * 1.5,
  },
  faqCategory: {
    marginTop: spacing.small,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
    padding: spacing.medium,
    marginVertical: spacing.medium,
    marginHorizontal: spacing.medium,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.medium,
  },
  askButtonText: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginTop: spacing.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  noteItem: {
    marginBottom: spacing.small,
  },
  noteText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});