import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '../src/constants/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={theme.background} translucent />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerTintColor: theme.text,
            headerTitleStyle: {
              fontWeight: '300',
              fontSize: 16,
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="search"
            options={{
              title: '検索',
              presentation: 'modal',
              headerStyle: { backgroundColor: theme.surface },
            }}
          />
          <Stack.Screen
            name="nearby"
            options={{
              title: '周辺検索',
              presentation: 'modal',
              headerStyle: { backgroundColor: theme.surface },
            }}
          />
          <Stack.Screen
            name="system/[id]"
            options={{
              title: 'システム情報',
              headerStyle: { backgroundColor: '#0d1220' },
            }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
