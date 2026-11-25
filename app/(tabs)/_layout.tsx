import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {
            backgroundColor: theme.background,
            borderTopColor: colorScheme === 'dark' ? '#303436' : '#DDE1E3',
          },
        }),
        headerShown: false,
        tabBarBackground: TabBarBackground,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={typeof color === 'string' ? color : theme.tabIconSelected} />,
        }}
      />
       <Tabs.Screen
        name="camera"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.fill" color={typeof color === 'string' ? color : theme.tabIconSelected} />,
        }}
      /> 
      <Tabs.Screen
        name="save"
        options={{
          title: 'Save',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.and.arrow.down.fill" color={typeof color === 'string' ? color : theme.tabIconSelected} />,
        }}
      />
      <Tabs.Screen
        name="delete"
        options={{
          title: 'delete',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="trash.fill" color={typeof color === 'string' ? color : theme.tabIconSelected} />,
        }}
      />
     
    </Tabs>
  );
}
