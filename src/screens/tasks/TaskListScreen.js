import React, {useState, useEffect, useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';

const TaskListScreen = ({navigation}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statuses, setStatuses] = useState({});
  const {token, user} = useAuth();

  const fetchStatuses = async () => {
    const result = await supabaseService.getStatuses(token);
    if (result.success && result.data) {
      const statusMap = {};
      result.data.forEach(status => {
        statusMap[status.id] = status.description;
      });
      setStatuses(statusMap);
    }
  };

  const fetchTasks = useCallback(async () => {
    const result = await supabaseService.getTasks(token, user.id);
    if (result.success && result.data) {
      setTasks(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  }, [token, user.id]);

  useEffect(() => {
    const loadData = async () => {
      await fetchStatuses();
      await fetchTasks();
    };
    loadData();
  }, [fetchTasks]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleDelete = (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await supabaseService.deleteTask(token, taskId);
            if (result.success) {
              setTasks(tasks.filter(t => t.id !== taskId));
            } else {
              Alert.alert('Error', result.error || 'Failed to delete task');
            }
          },
        },
      ],
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString.replace(' ', 'T'));
    const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timePart = `${hours}:${minutes}`;
    return `${datePart} ${timePart}`;
  };

  const getTimeStatus = (dateString, status_id) => {
    if (!dateString || status_id === 2) return null;
    const deadline = new Date(dateString.replace(' ', 'T'));
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hoursDiff = diff / (1000 * 60 * 60);
    
    if (diff < 0) {
      return { label: 'Overdue', color: '#FF3B30' };
    } else if (hoursDiff <= 24) {
      return { label: 'Due Soon', color: '#FF9500' };
    } else if (hoursDiff <= 48) {
      return { label: 'Due Today', color: '#FFCC00' };
    }
    return null;
  };

  const getStatusColor = (statusId) => {
    if (statusId === 2) return '#34C759';
    if (statusId === 3) return '#FF9500';
    if (statusId === 1) return '#8E8E93';
    return '#007AFF';
  };

  const upcomingTasks = tasks.filter(task => {
    if (!task.target_completion_time || task.status_id === 2) return false;
    const status = getTimeStatus(task.target_completion_time);
    return status !== null;
  });

  const renderTask = ({item}) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.task_name}</Text>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status_id)}]}>
          <Text style={styles.statusText}>{statuses[item.status_id] || 'Unknown'}</Text>
        </View>
      </View>
      {item.task_description ? (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.task_description}
        </Text>
      ) : null}
      <View style={styles.taskFooter}>
        <View style={styles.deadlineContainer}>
          <Text style={styles.deadlineText}>
            Due: {formatDateTime(item.target_completion_time)}
          </Text>
          {getTimeStatus(item.target_completion_time, item.status_id) && (
            <View style={[styles.timeStatusBadge, {backgroundColor: getTimeStatus(item.target_completion_time).color}]}>
              <Text style={styles.timeStatusText}>{getTimeStatus(item.target_completion_time).label}</Text>
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          {item.status_id !== 2 && (
            
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditTask', {task: item})}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log(new Date())

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome again { user.user_metadata.full_name }!</Text>
      </View>
      {upcomingTasks.length > 0 && (
        <TouchableOpacity style={styles.notificationBanner} onPress={() => Alert.alert('Upcoming Tasks', `${upcomingTasks.length} task(s) have upcoming deadlines`)}>
          <Text style={styles.notificationText}>⚠️ {upcomingTasks.length} task(s) due soon or overdue</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to create your first task
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTask')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  taskCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    color: "#000",
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 14,
    color: '#666',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  timeStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationBanner: {
    backgroundColor: '#FF3B30',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default TaskListScreen;