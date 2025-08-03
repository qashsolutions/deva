import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { GeneratedQuote, QuoteRequest } from '../../types/ai';
import { ServiceOffering } from '../../types/user';
import { formatPrice, formatDate } from '../../utils/formatters';

interface QuoteGeneratorProps {
  service: ServiceOffering;
  request: QuoteRequest;
  onGenerateQuote: (request: QuoteRequest) => Promise<GeneratedQuote>;
  onSendQuote: (quote: GeneratedQuote) => void;
  loading?: boolean;
}

export const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({
  service,
  request,
  onGenerateQuote,
  onSendQuote,
  loading = false,
}) => {
  const [generatedQuote, setGeneratedQuote] = useState<GeneratedQuote | null>(null);
  const [editedQuote, setEditedQuote] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customizations, setCustomizations] = useState({
    includeTravel: true,
    additionalServices: [] as string[],
    discountPercentage: 0,
  });

  const handleGenerateQuote = async () => {
    setGenerating(true);
    try {
      const quote = await onGenerateQuote(request);
      setGeneratedQuote(quote);
      setEditedQuote(quote.quoteText);
    } catch (error) {
      console.error('Error generating quote:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendQuote = () => {
    if (generatedQuote) {
      const finalQuote = {
        ...generatedQuote,
        quoteText: editedQuote,
      };
      onSendQuote(finalQuote);
    }
  };

  const renderRequestSummary = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons name="document-text" size={24} color={colors.primary} />
        <Text style={styles.sectionTitle}>Quote Request</Text>
      </View>

      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Service</Text>
        <Text style={styles.summaryValue}>{service.serviceName}</Text>
      </View>

      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Requirements</Text>
        <Text style={styles.summaryValue}>{request.requirements}</Text>
      </View>

      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Location</Text>
        <Text style={styles.summaryValue}>
          {request.location.city}, {request.location.state}
        </Text>
      </View>

      {request.proposedDate && (
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Proposed Date</Text>
          <Text style={styles.summaryValue}>
            {formatDate(new Date(request.proposedDate), 'MMMM d, yyyy')}
          </Text>
        </View>
      )}

      {request.specialInstructions && (
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Special Instructions</Text>
          <Text style={styles.summaryValue}>{request.specialInstructions}</Text>
        </View>
      )}
    </Card>
  );

  const renderQuoteCustomization = () => (
    <Card style={styles.customizationCard}>
      <Text style={styles.sectionTitle}>Customize Quote</Text>

      <View style={styles.customOption}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setCustomizations({
            ...customizations,
            includeTravel: !customizations.includeTravel,
          })}
        >
          <Ionicons
            name={customizations.includeTravel ? 'checkbox' : 'square-outline'}
            size={24}
            color={colors.primary}
          />
          <Text style={styles.checkboxLabel}>Include Travel Fee</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.discountSection}>
        <Text style={styles.discountLabel}>Apply Discount (%)</Text>
        <View style={styles.discountControls}>
          <TouchableOpacity
            style={styles.discountButton}
            onPress={() => setCustomizations({
              ...customizations,
              discountPercentage: Math.max(0, customizations.discountPercentage - 5),
            })}
          >
            <Ionicons name="remove" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.discountValue}>{customizations.discountPercentage}%</Text>
          <TouchableOpacity
            style={styles.discountButton}
            onPress={() => setCustomizations({
              ...customizations,
              discountPercentage: Math.min(30, customizations.discountPercentage + 5),
            })}
          >
            <Ionicons name="add" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderGeneratedQuote = () => {
    if (!generatedQuote) return null;

    return (
      <Card style={styles.quoteCard}>
        <View style={styles.quoteHeader}>
          <Ionicons name="sparkles" size={24} color={colors.warning} />
          <Text style={styles.sectionTitle}>Generated Quote</Text>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Ionicons
              name={isEditing ? 'checkmark' : 'create'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <TextInput
            style={styles.quoteInput}
            value={editedQuote}
            onChangeText={setEditedQuote}
            multiline
            placeholder="Edit quote text..."
          />
        ) : (
          <Text style={styles.quoteText}>{editedQuote}</Text>
        )}

        <View style={styles.priceBreakdown}>
          <Text style={styles.breakdownTitle}>Price Breakdown</Text>
          
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Base Service</Text>
            <Text style={styles.priceValue}>
              {formatPrice(generatedQuote.priceBreakdown.basePrice)}
            </Text>
          </View>

          {generatedQuote.priceBreakdown.travelFee && (
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Travel Fee</Text>
              <Text style={styles.priceValue}>
                {formatPrice(generatedQuote.priceBreakdown.travelFee)}
              </Text>
            </View>
          )}

          {generatedQuote.priceBreakdown.additionalServices?.map((service, index) => (
            <View key={index} style={styles.priceItem}>
              <Text style={styles.priceLabel}>{service.name}</Text>
              <Text style={styles.priceValue}>{formatPrice(service.price)}</Text>
            </View>
          ))}

          <View style={[styles.priceItem, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatPrice(generatedQuote.priceBreakdown.total)}
            </Text>
          </View>
        </View>

        <View style={styles.validitySection}>
          <Ionicons name="time-outline" size={16} color={colors.gray[600]} />
          <Text style={styles.validityText}>
            Valid until {formatDate(new Date(generatedQuote.validUntil), 'MMM d, yyyy')}
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          {generatedQuote.terms.map((term, index) => (
            <View key={index} style={styles.termItem}>
              <Text style={styles.termBullet}>•</Text>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>

        <View style={styles.personalMessageSection}>
          <Text style={styles.personalMessageLabel}>Personal Note</Text>
          <Text style={styles.personalMessage}>
            {generatedQuote.personalizedMessage}
          </Text>
        </View>
      </Card>
    );
  };

  const renderActions = () => (
    <View style={styles.actions}>
      {!generatedQuote ? (
        <Button
          title="Generate Quote"
          onPress={handleGenerateQuote}
          loading={generating}
          fullWidth
          size="large"
          icon="sparkles"
        />
      ) : (
        <>
          <Button
            title="Regenerate"
            onPress={handleGenerateQuote}
            loading={generating}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Send Quote"
            onPress={handleSendQuote}
            loading={loading}
            style={styles.actionButton}
            icon="send"
          />
        </>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderRequestSummary()}
      {renderQuoteCustomization()}
      {renderGeneratedQuote()}
      {renderActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  summaryHeader: {
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
  summaryItem: {
    marginBottom: spacing.medium,
  },
  summaryLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  summaryValue: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  customizationCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  customOption: {
    marginTop: spacing.medium,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  checkboxLabel: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  discountSection: {
    marginTop: spacing.large,
  },
  discountLabel: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  discountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  discountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountValue: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 50,
    textAlign: 'center',
  },
  quoteCard: {
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    gap: spacing.small,
  },
  editButton: {
    marginLeft: 'auto',
    padding: spacing.small,
  },
  quoteText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.5,
    marginBottom: spacing.large,
  },
  quoteInput: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.5,
    marginBottom: spacing.large,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
  },
  priceBreakdown: {
    backgroundColor: colors.gray[50],
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  breakdownTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  priceLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  priceValue: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  totalRow: {
    paddingTop: spacing.small,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: spacing.small,
  },
  totalLabel: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
  },
  validitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  validityText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  termsSection: {
    marginBottom: spacing.medium,
  },
  termsTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: spacing.xsmall,
  },
  termBullet: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginRight: spacing.small,
  },
  termText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    flex: 1,
  },
  personalMessageSection: {
    backgroundColor: colors.primary + '10',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
  },
  personalMessageLabel: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xsmall,
  },
  personalMessage: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.medium,
    paddingVertical: spacing.large,
    paddingHorizontal: spacing.medium,
  },
  actionButton: {
    flex: 1,
  },
});