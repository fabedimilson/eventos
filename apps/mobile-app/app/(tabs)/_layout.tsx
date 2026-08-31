import { Tabs } from 'expo-router';
import React from 'react';
import { Calendar, QrCode, MessageSquare, Award } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1B5E20',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        headerStyle: {
          backgroundColor: '#1B5E20',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Eventos IFAM',
          tabBarLabel: 'Eventos',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Leitor de QR Code',
          tabBarLabel: 'Check-in',
          tabBarIcon: ({ color, size }) => <QrCode color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Networking & Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="certificados"
        options={{
          title: 'Meus Certificados',
          tabBarLabel: 'Certificados',
          tabBarIcon: ({ color, size }) => <Award color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
