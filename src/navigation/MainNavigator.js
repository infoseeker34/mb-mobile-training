/**
 * Main Navigator
 * 
 * Bottom tab navigation for main app screens.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { messageApi } from '../services/api/messageApi';
import HomeScreen from '../screens/home/HomeScreen';
import TrainingScreen from '../screens/training/TrainingScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import PlanDetailsScreen from '../screens/training/PlanDetailsScreen';
import ActiveTrainingScreen from '../screens/training/ActiveTrainingScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import ConversationListScreen from '../screens/messages/ConversationListScreen';
import ThreadDetailScreen from '../screens/messages/ThreadDetailScreen';
import ComposeMessageScreen from '../screens/messages/ComposeMessageScreen';
import InvitationsScreen from '../screens/messages/InvitationsScreen';
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

// Messages Stack Navigator (includes ConversationList, ThreadDetail, and Compose screens)
const MessagesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="ConversationList" 
        component={ConversationListScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ThreadDetail" 
        component={ThreadDetailScreen}
        options={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="ComposeMessage" 
        component={ComposeMessageScreen}
        options={{
          title: 'New Message',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="Invitations" 
        component={InvitationsScreen}
        options={{
          title: 'Invitations',
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

const MainNavigator = () => {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll for unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await messageApi.getConversations();
      if (response.status === 'success' && response.data) {
        const totalUnread = response.data.conversations.reduce(
          (sum, conv) => sum + (conv.unread_count || 0),
          0
        );
        setUnreadMessageCount(totalUnread);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

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
            <View>
              <Ionicons 
                name={focused ? "chatbubbles" : "chatbubbles-outline"} 
                size={size} 
                color={color} 
              />
              {unreadMessageCount > 0 && (
                <View style={tabBadgeStyles.badge}>
                  <Text style={tabBadgeStyles.badgeText}>{unreadMessageCount}</Text>
                </View>
              )}
            </View>
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

const tabBadgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MainNavigator;
