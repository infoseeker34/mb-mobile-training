import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIVACY_POLICY_URL = 'https://www.magicboard.com/privacy';

const PrivacyPolicyScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <WebView
        source={{ uri: PRIVACY_POLICY_URL }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default PrivacyPolicyScreen;
