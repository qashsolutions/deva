import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PriestServicesStackParamList } from '../../navigation/PriestNavigator';
import { Card } from '../../components/common/Card';
import { Button, IconButton } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmationModal } from '../../components/common/Modal';
import { InlineLoader } from '../../components/common/LoadingSpinner';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize } from '../../config/theme';
import { formatPrice } from '../../utils/formatters';
import { ServiceOffering, PricingType } from '../../types/service';
import { SERVICE_TYPES, LANGUAGES } from '../../config/constants';

type NavigationProp = NativeStackNavigationProp<PriestServicesStackParamList, 'ServiceList'>;

export const ServiceManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { state: userState, updatePriestServices } = useUser();
  
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const priestProfile = userState.profile?.userType === 'priest' ? userState.profile.priestProfile : null;

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      // In real app, would fetch from Firestore
      if (priestProfile?.services) {
        setServices(priestProfile.services);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    navigation.navigate('AddEditService');
  };

  const handleEditService = (service: ServiceOffering) => {
    navigation.navigate('AddEditService', { serviceId: service.id, service });
  };

  const handleToggleService = async (serviceId: string) => {
    const updatedServices = services.map(service =>
      service.id === serviceId
        ? { ...service, isActive: !service.isActive }
        : service
    );
    
    setServices(updatedServices);
    
    try {
      await updatePriestServices(updatedServices);
    } catch (error) {
      console.error('Failed to toggle service:', error);
      Alert.alert('Error', 'Failed to update service status');
      // Revert on error
      loadServices();
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    
    setDeleting(true);
    
    try {
      const updatedServices = services.filter(s => s.id !== serviceToDelete);
      await updatePriestServices(updatedServices);
      setServices(updatedServices);
      Alert.alert('Success', 'Service deleted successfully');
    } catch (error) {
      console.error('Failed to delete service:', error);
      Alert.alert('Error', 'Failed to delete service');
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
      setServiceToDelete(null);
    }
  };

  const getServiceTypeInfo = (serviceType: string) => {
    const type = SERVICE_TYPES.find(t => t.id === serviceType);
    return type || { name: serviceType, icon: 'flower' };
  };

  const formatPricing = (service: ServiceOffering) => {
    switch (service.pricingType) {
      case 'fixed':
        return formatPrice(service.basePrice);
      case 'range':
        return `${formatPrice(service.priceRange?.min || 0)} - ${formatPrice(service.priceRange?.max || 0)}`;
      case 'quote':
        return 'Quote on request';
      default:
        return 'Contact for pricing';
    }
  };

  const renderServiceCard = ({ item }: { item: ServiceOffering }) => {
    const typeInfo = getServiceTypeInfo(item.serviceType);
    
    return (
      <Card
        onPress={() => handleEditService(item)}
        margin="small"
        style={[styles.serviceCard, !item.isActive && styles.inactiveCard]}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.serviceIcon}>
            <Ionicons 
              name={typeInfo.icon as any} 
              size={24} 
              color={item.isActive ? colors.primary : colors.gray[400]} 
            />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.serviceType}>{typeInfo.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => handleToggleService(item.id)}
          >
            <Ionicons
              name={item.isActive ? 'toggle' : 'toggle-outline'}
              size={32}
              color={item.isActive ? colors.primary : colors.gray[400]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.serviceDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>{formatPricing(item)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>{item.duration} minutes</Text>
          </View>

          {item.travelRadius && (
            <View style={styles.detailRow}>
              <Ionicons name="car-outline" size={16} color={colors.gray[600]} />
              <Text style={styles.detailText}>Up to {item.travelRadius} miles</Text>
            </View>
          )}
        </View>

        {item.languages && item.languages.length > 0 && (
          <View style={styles.languagesRow}>
            {item.languages.map((lang, index) => (
              <Badge
                key={index}
                label={LANGUAGES.find(l => l.code === lang)?.name || lang}
                size="small"
                variant="neutral"
              />
            ))}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditService(item)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setServiceToDelete(item.id);
              setDeleteModalVisible(true);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Services</Text>
      <IconButton
        icon={<Ionicons name="add" size={24} color={colors.white} />}
        onPress={handleAddService}
        variant="primary"
        accessibilityLabel="Add Service"
      />
    </View>
  );

  const renderSummary = () => {
    const activeServices = services.filter(s => s.isActive).length;
    const totalServices = services.length;

    return (
      <Card margin="medium" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalServices}</Text>
            <Text style={styles.summaryLabel}>Total Services</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{activeServices}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalServices - activeServices}</Text>
            <Text style={styles.summaryLabel}>Inactive</Text>
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <InlineLoader text="Loading services..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="list-outline"
            title="No Services Yet"
            message="Add your first service to start receiving bookings"
            action={{
              label: 'Add Service',
              onPress: handleAddService,
            }}
          />
        </View>
      ) : (
        <>
          {renderSummary()}
          <FlatList
            data={services}
            renderItem={renderServiceCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      <View style={styles.floatingButton}>
        <Button
          title="Add New Service"
          icon={<Ionicons name="add" size={20} color={colors.white} />}
          onPress={handleAddService}
          size="large"
          fullWidth
        />
      </View>

      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setServiceToDelete(null);
        }}
        onConfirm={handleDeleteService}
        title="Delete Service?"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        confirmButtonProps={{ loading: deleting }}
        danger
      />
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
  summaryCard: {
    marginBottom: spacing.small,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray[200],
  },
  summaryValue: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xsmall,
  },
  summaryLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  listContent: {
    paddingBottom: 100,
  },
  serviceCard: {
    marginHorizontal: spacing.medium,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  serviceType: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  toggleButton: {
    padding: spacing.small,
  },
  serviceDetails: {
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  detailText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  languagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xsmall,
    marginBottom: spacing.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
    paddingVertical: spacing.small,
  },
  actionButtonText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing.large,
    left: spacing.large,
    right: spacing.large,
  },
});