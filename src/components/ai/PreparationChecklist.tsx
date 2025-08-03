import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { CeremonyPreparation, RequiredItem } from '../../types/ai';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'spiritual' | 'physical' | 'material' | 'dietary' | 'items';
  completed: boolean;
  required: boolean;
  timeline?: string;
}

interface PreparationChecklistProps {
  ceremonyId: string;
  preparations: CeremonyPreparation[];
  items: RequiredItem[];
  onItemToggle?: (itemId: string, completed: boolean) => void;
  showProgress?: boolean;
}

export const PreparationChecklist: React.FC<PreparationChecklistProps> = ({
  ceremonyId,
  preparations,
  items,
  onItemToggle,
  showProgress = true,
}) => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'spiritual',
    'material',
    'items',
  ]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadChecklistState();
  }, [ceremonyId, preparations, items]);

  useEffect(() => {
    calculateProgress();
    saveChecklistState();
  }, [checklistItems]);

  const loadChecklistState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(`checklist_${ceremonyId}`);
      const completedItems = savedState ? JSON.parse(savedState) : {};

      // Convert preparations and items to checklist items
      const prepItems: ChecklistItem[] = preparations.map((prep, index) => ({
        id: `prep_${prep.category}_${index}`,
        title: prep.title,
        description: prep.description,
        category: prep.category,
        completed: completedItems[`prep_${prep.category}_${index}`] || false,
        required: prep.required,
        timeline: prep.timeline,
      }));

      const itemsList: ChecklistItem[] = items.map((item, index) => ({
        id: `item_${index}`,
        title: `${item.name} (${item.quantity})`,
        description: item.description,
        category: 'items' as const,
        completed: completedItems[`item_${index}`] || false,
        required: true,
        timeline: 'Before ceremony',
      }));

      setChecklistItems([...prepItems, ...itemsList]);
    } catch (error) {
      console.error('Error loading checklist state:', error);
    }
  };

  const saveChecklistState = async () => {
    try {
      const completedItems = checklistItems.reduce((acc, item) => ({
        ...acc,
        [item.id]: item.completed,
      }), {});
      
      await AsyncStorage.setItem(
        `checklist_${ceremonyId}`,
        JSON.stringify(completedItems)
      );
    } catch (error) {
      console.error('Error saving checklist state:', error);
    }
  };

  const calculateProgress = () => {
    const total = checklistItems.length;
    const completed = checklistItems.filter(item => item.completed).length;
    setProgress(total > 0 ? (completed / total) * 100 : 0);
  };

  const toggleItem = (itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setChecklistItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newCompleted = !item.completed;
        onItemToggle?.(itemId, newCompleted);
        return { ...item, completed: newCompleted };
      }
      return item;
    }));
  };

  const toggleCategory = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'spiritual': return 'flower';
      case 'physical': return 'body';
      case 'material': return 'cube';
      case 'dietary': return 'nutrition';
      case 'items': return 'basket';
      default: return 'list';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'spiritual': return colors.primary;
      case 'physical': return colors.info;
      case 'material': return colors.warning;
      case 'dietary': return colors.success;
      case 'items': return colors.error;
      default: return colors.gray[600];
    }
  };

  const renderProgressBar = () => {
    if (!showProgress) return null;

    return (
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Preparation Progress</Text>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        
        <Text style={styles.progressSubtext}>
          {checklistItems.filter(item => item.completed).length} of {checklistItems.length} items completed
        </Text>
      </Card>
    );
  };

  const renderCategory = (category: string) => {
    const categoryItems = checklistItems.filter(item => item.category === category);
    if (categoryItems.length === 0) return null;

    const completedCount = categoryItems.filter(item => item.completed).length;
    const isExpanded = expandedCategories.includes(category);

    return (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category)}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category) + '20' }]}>
              <Ionicons
                name={getCategoryIcon(category) as any}
                size={20}
                color={getCategoryColor(category)}
              />
            </View>
            <Text style={styles.categoryTitle}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            <Badge
              text={`${completedCount}/${categoryItems.length}`}
              variant={completedCount === categoryItems.length ? 'success' : 'secondary'}
              size="small"
            />
          </View>
          
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.gray[600]}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryItems}>
            {categoryItems.map(item => renderChecklistItem(item))}
          </View>
        )}
      </View>
    );
  };

  const renderChecklistItem = (item: ChecklistItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.checklistItem}
      onPress={() => toggleItem(item.id)}
    >
      <View style={styles.checkboxContainer}>
        <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
          {item.completed && (
            <Ionicons name="checkmark" size={16} color={colors.white} />
          )}
        </View>
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[
            styles.itemTitle,
            item.completed && styles.itemTitleCompleted
          ]}>
            {item.title}
          </Text>
          {item.required && !item.completed && (
            <Badge text="Required" variant="error" size="small" />
          )}
        </View>
        
        <Text style={[
          styles.itemDescription,
          item.completed && styles.itemDescriptionCompleted
        ]}>
          {item.description}
        </Text>
        
        {item.timeline && (
          <View style={styles.timeline}>
            <Ionicons name="time-outline" size={14} color={colors.gray[500]} />
            <Text style={styles.timelineText}>{item.timeline}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const categories = ['spiritual', 'physical', 'material', 'dietary', 'items'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderProgressBar()}
      
      <View style={styles.categories}>
        {categories.map(category => renderCategory(category))}
      </View>
      
      <View style={styles.footer}>
        <Ionicons name="information-circle" size={16} color={colors.gray[600]} />
        <Text style={styles.footerText}>
          Tap items to mark them as complete. Your progress is automatically saved.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  progressTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  progressPercentage: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.small,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressSubtext: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  categories: {
    paddingHorizontal: spacing.medium,
  },
  categorySection: {
    marginBottom: spacing.medium,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.medium,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  categoryItems: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.medium,
    padding: spacing.small,
  },
  checklistItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginBottom: spacing.small,
  },
  checkboxContainer: {
    marginRight: spacing.medium,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.small,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xsmall,
  },
  itemTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  itemTitleCompleted: {
    color: colors.gray[500],
    textDecorationLine: 'line-through',
  },
  itemDescription: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    lineHeight: fontSize.small * 1.4,
  },
  itemDescriptionCompleted: {
    color: colors.gray[400],
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xsmall,
    gap: spacing.xsmall,
  },
  timelineText: {
    fontSize: fontSize.xsmall,
    color: colors.gray[500],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.large,
  },
  footerText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    flex: 1,
  },
});