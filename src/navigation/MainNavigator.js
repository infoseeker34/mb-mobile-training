/**
 * Main Navigator
 * 
 * Bottom tab navigation for main app screens.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import TrainingScreen from '../screens/training/TrainingScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import PlanDetailsScreen from '../screens/training/PlanDetailsScreen';
import ActiveTrainingScreen from '../screens/training/ActiveTrainingScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import TeamMessagesScreen from '../screens/messages/TeamMessagesScreen';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Training Stack Navigator (includes Training, PlanDetails, and ActiveTraining screens)
const TrainingStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TrainingMain" 
        component={TrainingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PlanDetails" 
        component={PlanDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ActiveTraining" 
        component={ActiveTrainingScreen}
        options={{
          title: 'Training Session',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Calendar Stack Navigator (includes Calendar, PlanDetails, and ActiveTraining screens)
const CalendarStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CalendarMain" 
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PlanDetails" 
        component={PlanDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ActiveTraining" 
        component={ActiveTrainingScreen}
        options={{
          title: 'Training Session',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Messages Stack Navigator (includes Messages and TeamMessages screens)
const MessagesStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MessagesMain" 
        component={MessagesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TeamMessages" 
        component={TeamMessagesScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.textInverse,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          height: Layout.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: Layout.fontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={size} 
              color={color} 
            />
          ),
          headerTitle: 'Magic Board Training',
        }}
      />
      
      <Tab.Screen
        name="Training"
        component={TrainingStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "barbell" : "barbell-outline"} 
              size={size} 
              color={color} 
            />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "calendar" : "calendar-outline"} 
              size={size} 
              color={color} 
            />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "chatbubbles" : "chatbubbles-outline"} 
              size={size} 
              color={color} 
            />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};


// Placeholder screen for tabs not yet implemented
const PlaceholderScreen = () => {
  const { View, Text, StyleSheet } = require('react-native');
  
  return (
    <View style={placeholderStyles.container}>
      <Text style={placeholderStyles.text}>Coming Soon! 🚀</Text>
    </View>
  );
};

const placeholderStyles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: Layout.fontSize.xl,
    color: Colors.textSecondary,
  },
};

export default MainNavigator;
