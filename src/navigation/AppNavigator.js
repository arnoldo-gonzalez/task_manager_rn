import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {TouchableOpacity, Text} from 'react-native';
import TaskListScreen from '../screens/tasks/TaskListScreen';
import CreateTaskScreen from '../screens/tasks/CreateTaskScreen';
import EditTaskScreen from '../screens/tasks/EditTaskScreen';
import {useAuth} from '../context/AuthContext';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const {logout} = useAuth();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{
          title: 'My Tasks',
          headerRight: () => (
            <TouchableOpacity onPress={logout}>
              <Text style={{color: '#007AFF', fontSize: 16}}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{
          title: 'Create Task',
        }}
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{
          title: 'Edit Task',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;