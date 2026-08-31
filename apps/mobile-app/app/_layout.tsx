import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#1B5E20" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1B5E20',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="sessao/[id]"
          options={{
            title: 'Palestra & Transmissão',
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}
