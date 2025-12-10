import 'react-native-get-random-values';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VoiceNotesListScreen } from './screens/VoiceNotesListScreen';
import { VoiceNoteDetailScreen } from './screens/VoiceNoteDetailScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{
          headerStyle: { backgroundColor: '#05060b' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#05060b' }
        }}>
          <Stack.Screen
            name="List"
            component={VoiceNotesListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Detail"
            component={VoiceNoteDetailScreen}
            options={{ title: 'Voice Note' }}
          />
          <Stack.Screen
            name="History"
            getComponent={() => require('./screens/HistoryScreen').HistoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Lipsync"
            getComponent={() => require('./screens/LipsyncScreen').LipsyncScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
