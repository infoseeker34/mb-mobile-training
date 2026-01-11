/**
 * Main Navigator
 * 
 * Bottom tab navigation for main app screens.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';

const Tab = createBottomTabNavigator();

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
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="🏠" color={color} />
          ),
          headerTitle: 'Magic Board Training',
        }}
      />
      
      {/* Placeholder tabs for future features */}
      <Tab.Screen
        name="Training"
        component={PlaceholderScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="🎯" color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Progress"
        component={PlaceholderScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="📊" color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={PlaceholderScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="👤" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Simple tab icon component
const TabIcon = ({ icon, color }) => {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: 24, color: color }}>
      {icon}
    </Text>
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
