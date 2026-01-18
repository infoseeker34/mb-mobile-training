import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';

const AssignmentModal = ({
  visible,
  onClose,
  onSave,
  assignment = null,
  programName,
  isEditing = false,
}) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('weekly');
  const [selectedDays, setSelectedDays] = useState([]);
  const [notes, setNotes] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  useEffect(() => {
    if (visible) {
      if (assignment) {
        // Editing existing assignment
        setStartDate(new Date(assignment.startDate));
        setEndDate(assignment.endDate ? new Date(assignment.endDate) : null);
        setHasEndDate(!!assignment.endDate);
        setIsRecurring(assignment.isRecurring || false);
        setRecurrenceFrequency(assignment.recurrenceFrequency || 'weekly');
        setSelectedDays(assignment.daysOfWeek || []);
        setNotes(assignment.notes || '');
      } else {
        // Creating new assignment - reset to defaults
        setStartDate(new Date());
        setEndDate(null);
        setHasEndDate(false);
        setIsRecurring(false);
        setRecurrenceFrequency('weekly');
        setSelectedDays([]);
        setNotes('');
      }
    }
  }, [visible, assignment]);

  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handleSave = async () => {
    // Validation
    if (isRecurring && selectedDays.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one day of the week for recurring assignments.');
      return;
    }

    if (hasEndDate && endDate && endDate < startDate) {
      Alert.alert('Validation Error', 'End date must be after start date.');
      return;
    }

    setSaving(true);
    try {
      const assignmentData = {
        startDate: startDate.toISOString(),
        endDate: hasEndDate && endDate ? endDate.toISOString() : null,
        isRecurring,
        recurrenceFrequency: isRecurring ? 'weekly' : null,
        daysOfWeek: isRecurring ? selectedDays : null,
        notes: notes.trim() || null,
      };

      await onSave(assignmentData);
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Modify Schedule' : 'Add to Schedule'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.programName}>{programName}</Text>

            {/* Start Date */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
            </View>

            {/* End Date Toggle */}
            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <Text style={styles.sectionLabel}>Set End Date</Text>
                <TouchableOpacity
                  style={[styles.toggle, hasEndDate && styles.toggleActive]}
                  onPress={() => {
                    setHasEndDate(!hasEndDate);
                    if (!hasEndDate) {
                      const defaultEnd = new Date(startDate);
                      defaultEnd.setMonth(defaultEnd.getMonth() + 1);
                      setEndDate(defaultEnd);
                    }
                  }}
                >
                  <View style={[styles.toggleThumb, hasEndDate && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
              {hasEndDate && (
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                  <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Recurring Toggle */}
            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <Text style={styles.sectionLabel}>Recurring</Text>
                <TouchableOpacity
                  style={[styles.toggle, isRecurring && styles.toggleActive]}
                  onPress={() => setIsRecurring(!isRecurring)}
                >
                  <View style={[styles.toggleThumb, isRecurring && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Days of Week (for recurring assignments) */}
            {isRecurring && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Days of Week</Text>
                <View style={styles.daysContainer}>
                  {daysOfWeek.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayButton,
                        selectedDays.includes(day.value) && styles.dayButtonActive,
                      ]}
                      onPress={() => toggleDay(day.value)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          selectedDays.includes(day.value) && styles.dayButtonTextActive,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes about this training schedule..."
                placeholderTextColor={Colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : isEditing ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Android Date Pickers - native modal */}
          {Platform.OS === 'android' && showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate && event.type === 'set') {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}
          {Platform.OS === 'android' && showEndPicker && endDate && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate && event.type === 'set') {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}
        </View>
      </View>
      
      {/* iOS Date Picker Modal - separate modal that can be dismissed */}
      {Platform.OS === 'ios' && showStartPicker && (
        <Modal
          visible={showStartPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStartPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowStartPicker(false)}>
            <View style={styles.datePickerOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select Start Date</Text>
                  </View>
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setStartDate(selectedDate);
                      }
                    }}
                    style={styles.datePickerIOS}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
      
      {Platform.OS === 'ios' && showEndPicker && endDate && (
        <Modal
          visible={showEndPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEndPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowEndPicker(false)}>
            <View style={styles.datePickerOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select End Date</Text>
                  </View>
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="spinner"
                    minimumDate={startDate}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setEndDate(selectedDate);
                      }
                    }}
                    style={styles.datePickerIOS}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: Layout.spacing.xs,
  },
  modalContent: {
    padding: Layout.spacing.lg,
  },
  programName: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Layout.spacing.lg,
  },
  section: {
    marginBottom: Layout.spacing.lg,
  },
  sectionLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Layout.spacing.sm,
  },
  dateButtonText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    padding: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  frequencyButtonText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  frequencyButtonTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
  },
  dayButton: {
    flex: 1,
    padding: Layout.spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerButton: {
    flex: 1,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  datePickerHeader: {
    padding: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  datePickerTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  datePickerIOS: {
    backgroundColor: Colors.surface,
  },
});

export default AssignmentModal;
