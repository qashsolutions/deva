import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PriestCalendarStackParamList } from '../../navigation/PriestNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Button, OutlineButton } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/common/Modal';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatDate, formatTime } from '../../utils/formatters';
import { PriestAvailability, DaySchedule, UnavailableDate } from '../../types/user';

type NavigationProp = NativeStackNavigationProp<PriestCalendarStackParamList, 'Availability'>;

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' },
];

const DEFAULT_SCHEDULE: DaySchedule = {
  isAvailable: true,
  slots: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
};

export const AvailabilityScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { state: userState, updatePriestAvailability } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [schedule, setSchedule] = useState<PriestAvailability['schedule']>({
    monday: DEFAULT_SCHEDULE,
    tuesday: DEFAULT_SCHEDULE,
    wednesday: DEFAULT_SCHEDULE,
    thursday: DEFAULT_SCHEDULE,
    friday: DEFAULT_SCHEDULE,
    saturday: DEFAULT_SCHEDULE,
    sunday: { isAvailable: false, slots: [] },
  });
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ day: string; index: number } | null>(null);

  const priestProfile = userState.profile?.userType === 'priest' ? userState.profile.priestProfile : null;

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      if (priestProfile?.availability) {
        setIsAvailable(priestProfile.availability.isAvailable);
        setSchedule(priestProfile.availability.schedule);
        setUnavailableDates(priestProfile.availability.unavailableDates || []);
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const availability: PriestAvailability = {
        isAvailable,
        schedule,
        unavailableDates,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      
      await updatePriestAvailability(availability);
      Alert.alert('Success', 'Availability updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save availability:', error);
      Alert.alert('Error', 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const toggleDayAvailability = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable,
      },
    }));
  };

  const addTimeSlot = (day: string) => {
    const daySchedule = schedule[day];
    const lastSlot = daySchedule.slots[daySchedule.slots.length - 1];
    const newSlot = lastSlot
      ? { start: lastSlot.end, end: addHours(lastSlot.end, 2) }
      : { start: '09:00', end: '11:00' };
    
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, newSlot],
      },
    }));
  };

  const removeTimeSlot = (day: string, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }));
  };

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const addUnavailableDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const exists = unavailableDates.some(d => d.date === dateString);
    
    if (!exists) {
      setUnavailableDates([
        ...unavailableDates,
        {
          date: dateString,
          reason: 'Personal time off',
        },
      ]);
    }
    setShowDatePicker(false);
  };

  const removeUnavailableDate = (date: string) => {
    setUnavailableDates(unavailableDates.filter(d => d.date !== date));
  };

  const addHours = (time: string, hours: number): string => {
    const [h, m] = time.split(':').map(Number);
    const newHour = (h + hours) % 24;
    return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Availability Settings</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderOnlineStatus = () => (
    <Card margin="medium" style={styles.statusCard}>
      <View style={styles.statusRow}>
        <View>
          <Text style={styles.statusTitle}>Online Status</Text>
          <Text style={styles.statusSubtitle}>
            {isAvailable ? 'You are available for bookings' : 'You are offline'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          trackColor={{ false: colors.gray[300], true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>
    </Card>
  );

  const renderWeeklySchedule = () => (
    <SectionCard title="Weekly Schedule" margin="medium">
      {DAYS_OF_WEEK.map((day) => {
        const daySchedule = schedule[day.id];
        
        return (
          <View key={day.id} style={styles.dayContainer}>
            <TouchableOpacity
              style={styles.dayHeader}
              onPress={() => toggleDayAvailability(day.id)}
            >
              <Text style={[
                styles.dayName,
                !daySchedule.isAvailable && styles.dayNameInactive
              ]}>
                {day.label}
              </Text>
              <Switch
                value={daySchedule.isAvailable}
                onValueChange={() => toggleDayAvailability(day.id)}
                trackColor={{ false: colors.gray[300], true: colors.primary }}
                thumbColor={colors.white}
              />
            </TouchableOpacity>
            
            {daySchedule.isAvailable && (
              <View style={styles.slotsContainer}>
                {daySchedule.slots.map((slot, index) => (
                  <View key={index} style={styles.slotRow}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        setSelectedDay(day.id);
                        setEditingSlot({ day: day.id, index });
                      }}
                    >
                      <Text style={styles.timeText}>
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeTimeSlot(day.id, index)}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addSlotButton}
                  onPress={() => addTimeSlot(day.id)}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.addSlotText}>Add time slot</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </SectionCard>
  );

  const renderUnavailableDates = () => (
    <SectionCard 
      title="Unavailable Dates" 
      headerAction={
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={styles.addDateText}>Add Date</Text>
        </TouchableOpacity>
      }
      margin="medium"
    >
      {unavailableDates.length === 0 ? (
        <Text style={styles.emptyText}>No dates marked as unavailable</Text>
      ) : (
        <View style={styles.datesContainer}>
          {unavailableDates.map((item, index) => (
            <View key={index} style={styles.dateItem}>
              <Text style={styles.dateText}>
                {formatDate(new Date(item.date), 'MMM d, yyyy')}
              </Text>
              <TouchableOpacity
                onPress={() => removeUnavailableDate(item.date)}
                style={styles.removeDateButton}
              >
                <Ionicons name="close" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <OutlineButton
        title="Copy from last week"
        onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon!')}
        fullWidth
        style={styles.quickActionButton}
      />
      <OutlineButton
        title="Set all days same"
        onPress={() => setShowConfirmModal(true)}
        fullWidth
        style={styles.quickActionButton}
      />
    </View>
  );

  if (loading) {
    return <PageLoader text="Loading availability settings..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderOnlineStatus()}
        {renderWeeklySchedule()}
        {renderUnavailableDates()}
        {renderQuickActions()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="large"
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            if (event.type === 'set' && date) {
              addUnavailableDate(date);
            } else {
              setShowDatePicker(false);
            }
          }}
        />
      )}

      <ConfirmationModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          const mondaySchedule = schedule.monday;
          const newSchedule = { ...schedule };
          DAYS_OF_WEEK.forEach(day => {
            newSchedule[day.id] = { ...mondaySchedule };
          });
          setSchedule(newSchedule);
          setShowConfirmModal(false);
        }}
        title="Apply Monday's Schedule?"
        message="This will apply Monday's schedule to all days of the week. Continue?"
        confirmText="Apply"
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
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: colors.primary + '10',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  statusSubtitle: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  dayContainer: {
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  dayName: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dayNameInactive: {
    color: colors.text.secondary,
  },
  slotsContainer: {
    marginLeft: spacing.medium,
    marginTop: spacing.small,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  timeButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: borderRadius.medium,
    marginRight: spacing.small,
  },
  timeText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  removeButton: {
    padding: spacing.xsmall,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.small,
    gap: spacing.small,
  },
  addSlotText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  addDateText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.large,
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.small,
    paddingLeft: spacing.medium,
    paddingRight: spacing.small,
    borderRadius: borderRadius.medium,
    gap: spacing.small,
  },
  dateText: {
    fontSize: fontSize.small,
    color: colors.text.primary,
  },
  removeDateButton: {
    padding: spacing.xsmall,
  },
  quickActions: {
    marginHorizontal: spacing.medium,
    marginTop: spacing.large,
    gap: spacing.medium,
  },
  quickActionButton: {
    marginBottom: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.large,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});