import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { PricingInsight } from '../../types/ai';
import { formatPrice } from '../../utils/formatters';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface PricingAssistantProps {
  insight: PricingInsight | null;
  loading?: boolean;
  onUpdatePricing?: (price: number) => void;
  currentPrice?: number;
}

export const PricingAssistant: React.FC<PricingAssistantProps> = ({
  insight,
  loading,
  onUpdatePricing,
  currentPrice,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analyzing market prices...</Text>
      </View>
    );
  }

  if (!insight) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No pricing data available</Text>
      </View>
    );
  }

  const renderPriceComparison = () => {
    const { suggestedPrice } = insight.recommendations;
    const { averagePrice, priceRange } = insight.marketAnalysis;
    const priceDiff = currentPrice ? ((currentPrice - suggestedPrice) / suggestedPrice) * 100 : 0;

    return (
      <Card style={styles.comparisonCard}>
        <View style={styles.comparisonHeader}>
          <Ionicons name="analytics" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Price Analysis</Text>
        </View>

        <View style={styles.priceGrid}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Your Price</Text>
            <Text style={styles.priceValue}>
              {currentPrice ? formatPrice(currentPrice) : 'Not set'}
            </Text>
            {currentPrice && priceDiff !== 0 && (
              <Badge
                text={`${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(0)}%`}
                variant={Math.abs(priceDiff) > 20 ? 'warning' : 'success'}
                size="small"
              />
            )}
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Suggested</Text>
            <Text style={[styles.priceValue, styles.suggestedPrice]}>
              {formatPrice(suggestedPrice)}
            </Text>
            <Badge
              text={insight.recommendations.pricingStrategy}
              variant="primary"
              size="small"
            />
          </View>
        </View>

        <View style={styles.marketStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Market Average</Text>
            <Text style={styles.statValue}>{formatPrice(averagePrice)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Price Range</Text>
            <Text style={styles.statValue}>
              {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Competitors</Text>
            <Text style={styles.statValue}>{insight.marketAnalysis.competitorCount}</Text>
          </View>
        </View>

        {onUpdatePricing && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => onUpdatePricing(suggestedPrice)}
          >
            <Text style={styles.updateButtonText}>
              Update to Suggested Price
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  const renderMarketInsights = () => {
    const { demandLevel } = insight.marketAnalysis;
    const { reasoning, adjustmentFactors } = insight.recommendations;

    return (
      <Card style={styles.insightsCard}>
        <View style={styles.insightHeader}>
          <Ionicons name="bulb" size={24} color={colors.warning} />
          <Text style={styles.sectionTitle}>Market Insights</Text>
        </View>

        <View style={styles.demandIndicator}>
          <Text style={styles.demandLabel}>Current Demand:</Text>
          <Badge
            text={demandLevel.toUpperCase()}
            variant={
              demandLevel === 'high' ? 'success' :
              demandLevel === 'moderate' ? 'warning' : 'secondary'
            }
          />
        </View>

        <Text style={styles.reasoning}>{reasoning}</Text>

        <TouchableOpacity
          onPress={() => setShowDetails(!showDetails)}
          style={styles.detailsToggle}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Hide' : 'Show'} Pricing Factors
          </Text>
          <Ionicons
            name={showDetails ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>

        {showDetails && (
          <View style={styles.factorsList}>
            {adjustmentFactors.map((factor, index) => (
              <View key={index} style={styles.factorItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    );
  };

  const renderTrends = () => {
    const { direction, seasonalFactors, peakDates } = insight.trends;
    
    // Mock data for chart
    const chartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        data: [200, 220, 250, 240, 280, 300],
      }],
    };

    return (
      <Card style={styles.trendsCard}>
        <View style={styles.trendsHeader}>
          <Ionicons name="trending-up" size={24} color={colors.success} />
          <Text style={styles.sectionTitle}>Price Trends</Text>
          <Badge
            text={direction.toUpperCase()}
            variant={
              direction === 'increasing' ? 'success' :
              direction === 'decreasing' ? 'error' : 'secondary'
            }
            size="small"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={screenWidth - spacing.large * 2}
            height={180}
            chartConfig={{
              backgroundColor: colors.white,
              backgroundGradientFrom: colors.white,
              backgroundGradientTo: colors.white,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.text.secondary,
              style: {
                borderRadius: borderRadius.medium,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </ScrollView>

        <View style={styles.seasonalInfo}>
          <Text style={styles.seasonalTitle}>Seasonal Patterns</Text>
          {seasonalFactors.map((factor, index) => (
            <View key={index} style={styles.seasonalItem}>
              <Ionicons name="calendar" size={16} color={colors.gray[600]} />
              <Text style={styles.seasonalText}>{factor}</Text>
            </View>
          ))}
        </View>

        {peakDates.length > 0 && (
          <View style={styles.peakDates}>
            <Text style={styles.peakTitle}>Peak Pricing Periods</Text>
            <View style={styles.peakList}>
              {peakDates.map((date, index) => (
                <Badge
                  key={index}
                  text={date}
                  variant="secondary"
                  size="small"
                  style={styles.peakBadge}
                />
              ))}
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderPriceComparison()}
      {renderMarketInsights()}
      {renderTrends()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xlarge * 2,
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
    paddingVertical: spacing.xlarge * 2,
  },
  emptyText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  comparisonCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.large,
    gap: spacing.small,
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  priceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.medium,
  },
  priceLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  priceValue: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  suggestedPrice: {
    color: colors.primary,
  },
  marketStats: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: spacing.medium,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  statLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  updateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    marginTop: spacing.medium,
  },
  updateButtonText: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.white,
  },
  insightsCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    gap: spacing.small,
  },
  demandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    gap: spacing.small,
  },
  demandLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  reasoning: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.5,
    marginBottom: spacing.medium,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.small,
    gap: spacing.xsmall,
  },
  detailsToggleText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  factorsList: {
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
    gap: spacing.small,
  },
  factorText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    flex: 1,
  },
  trendsCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  trendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    gap: spacing.small,
  },
  chart: {
    marginVertical: spacing.small,
    borderRadius: borderRadius.medium,
  },
  seasonalInfo: {
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  seasonalTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  seasonalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xsmall,
    gap: spacing.small,
  },
  seasonalText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  peakDates: {
    marginTop: spacing.medium,
  },
  peakTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  peakList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  peakBadge: {
    marginRight: spacing.xsmall,
  },
});