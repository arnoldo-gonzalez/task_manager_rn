import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';

const CreateTaskScreen = ({navigation}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  /* const [statusId, setStatusId] = useState(null); */
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  /* const [statuses, setStatuses] = useState([]); */
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const {token, user} = useAuth();

  try {

  /* useEffect(() => {
    const fetchStatuses = async () => {
      const result = await supabaseService.getStatuses(token);
      if (result.success && result.data) {
        setStatuses(result.data);
        if (result.data.length > 0) {
          setStatusId(result.data[0].id);
        }
      }
      setLoading(false);
    };
    fetchStatuses();
  }, [token]); */

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setSaving(true);

    const taskData = {
      user_id: user.id,
      task_name: title.trim(),
      task_description: description.trim() || null,
      target_completion_time: formatDateTimeForDb(),
      status_id: 1,
    };

    const result = await supabaseService.createTask(token, taskData);

    setSaving(false);

    if (result.success) {
      Alert.alert('Success', 'Task created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to create task');
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDateTimeForDb = () => {
    if (!targetDate || !targetTime) return null;
    return `${targetDate} ${targetTime}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Task</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter task description"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Target Completion Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={async () => {
              if (Platform.OS === 'android') {
                const currentDate = targetDate ? new Date(targetDate) : new Date();
                try {
                  const dateResult = await DateTimePickerAndroid.open({
                    value: currentDate,
                    mode: 'date',
                    is24Hour: true,
                  });
                  if (dateResult.action === DateTimePickerAndroid.dateSetAction) {
                    setTargetDate(formatDate(dateResult.date));
                  }
                } catch (error) {
                  console.log('DateTimePicker error:', error);
                }
              } else {
                setShowDatePicker(true);
              }
            }}>
            <Text style={targetDate ? styles.pickerButtonText : styles.placeholderText}>
              {targetDate || 'Select date'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && Platform.OS === 'ios' && (
            <DateTimePicker
              value={targetDate ? new Date(targetDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'ios') {
                  if (event.type === 'dismissed' || !selectedDate) {
                    setShowDatePicker(false);
                    return;
                  }
                  if (selectedDate) {
                    setTargetDate(formatDate(selectedDate));
                  }
                  setShowDatePicker(false);
                }
              }}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Target Completion Time</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={async () => {
              if (Platform.OS === 'android') {
                const currentDate = targetTime ? new Date(`2000-01-01 ${targetTime}`) : new Date();
                try {
                  const timeResult = await DateTimePickerAndroid.open({
                    value: currentDate,
                    mode: 'time',
                    is24Hour: true,
                  });
                  if (timeResult.action === DateTimePickerAndroid.timeSetAction) {
                    setTargetTime(formatTime(timeResult.date));
                  }
                } catch (error) {
                  console.log('DateTimePicker error:', error);
                }
              } else {
                setShowTimePicker(true);
              }
            }}>
            <Text style={targetTime ? styles.pickerButtonText : styles.placeholderText}>
              {targetTime || 'Select time'}
            </Text>
          </TouchableOpacity>

          {showTimePicker && Platform.OS === 'ios' && (
            <DateTimePicker
              value={targetTime ? new Date(`2000-01-01 ${targetTime}`) : new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'ios') {
                  if (event.type === 'dismissed' || !selectedDate) {
                    setShowTimePicker(false);
                    return;
                  }
                  if (selectedDate) {
                    setTargetTime(formatTime(selectedDate));
                  }
                  setShowTimePicker(false);
                }
              }}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={saving}>
          <Text style={styles.buttonText}>
            {saving ? 'Creating...' : 'Create Task'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  } catch (e) {
    console.log(e)
    return (
      <Text></Text>
    );

  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  pickerOptions: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#f8f8f8',
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerOptionSelected: {
    backgroundColor: '#007AFF',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#99BFFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default CreateTaskScreen;