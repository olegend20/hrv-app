import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

interface LogTodayPromptProps {
  onDismiss?: () => void;
}

export function LogTodayPrompt({ onDismiss }: LogTodayPromptProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>☀️</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Start Your Morning Check-In</Text>
          <Text style={styles.subtitle}>
            Upload data, get AI analysis, and receive your personalized plan
          </Text>
        </View>
      </View>
      <Link href="/morning-ritual" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Start Now</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e65100',
  },
  subtitle: {
    fontSize: 12,
    color: '#e65100',
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#e65100',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
