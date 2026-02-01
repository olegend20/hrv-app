import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface DeepDiveProps {
  deepDive: any; // The deepDive object from API response
}

export function DeepDiveAnalysis({ deepDive }: DeepDiveProps) {
  if (!deepDive) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Data Interpretation */}
      {deepDive.dataInterpretation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 What Your Data Is Actually Saying</Text>
          <View style={styles.card}>
            <Text style={styles.headline}>{deepDive.dataInterpretation.headline}</Text>
            {deepDive.dataInterpretation.autonomicState && (
              <Text style={styles.bodyText}>{deepDive.dataInterpretation.autonomicState}</Text>
            )}
            {deepDive.dataInterpretation.keyDistinction && (
              <View style={styles.highlight}>
                <Text style={styles.highlightText}>➡️ {deepDive.dataInterpretation.keyDistinction}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Likely Contributors */}
      {deepDive.likelyContributors && deepDive.likelyContributors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Most Likely Contributors (Ranked by Impact)</Text>
          {deepDive.likelyContributors.map((contributor: any, index: number) => (
            <View key={index} style={styles.card}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankNumber}>{contributor.rank}</Text>
              </View>
              <Text style={styles.contributorTitle}>{contributor.factor}</Text>
              
              {contributor.evidence && contributor.evidence.length > 0 && (
                <View style={styles.evidenceBox}>
                  <Text style={styles.evidenceTitle}>Evidence from your data:</Text>
                  {contributor.evidence.map((e: string, i: number) => (
                    <Text key={i} style={styles.evidenceItem}>• {e}</Text>
                  ))}
                </View>
              )}
              
              {contributor.mechanism && (
                <Text style={styles.mechanismText}>{contributor.mechanism}</Text>
              )}
              
              {contributor.impact && (
                <Text style={styles.impactText}>💥 {contributor.impact}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* What This Is NOT */}
      {deepDive.whatThisIsNot && deepDive.whatThisIsNot.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✋ What This Is NOT</Text>
          <View style={styles.card}>
            {deepDive.whatThisIsNot.map((item: string, index: number) => (
              <Text key={index} style={styles.notItem}>❌ {item}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Today's Plan */}
      {deepDive.todaysPlan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ What To Do TODAY</Text>
          <View style={styles.card}>
            {deepDive.todaysPlan.approach && (
              <Text style={styles.approachText}>{deepDive.todaysPlan.approach}</Text>
            )}
            
            {deepDive.todaysPlan.keyActions && deepDive.todaysPlan.keyActions.length > 0 && (
              <View style={styles.actionsContainer}>
                {deepDive.todaysPlan.keyActions.map((action: any, index: number) => (
                  <View key={index} style={styles.actionCard}>
                    <View style={styles.actionHeader}>
                      <Text style={styles.actionPriority}>Priority {action.priority}</Text>
                      <Text style={styles.actionTitle}>{action.action}</Text>
                    </View>
                    {action.why && <Text style={styles.actionWhy}>Why: {action.why}</Text>}
                    {action.howTo && <Text style={styles.actionHow}>How: {action.howTo}</Text>}
                  </View>
                ))}
              </View>
            )}
            
            {deepDive.todaysPlan.avoid && deepDive.todaysPlan.avoid.length > 0 && (
              <View style={styles.avoidBox}>
                <Text style={styles.avoidTitle}>🚫 Avoid Today:</Text>
                {deepDive.todaysPlan.avoid.map((item: string, i: number) => (
                  <Text key={i} style={styles.avoidItem}>• {item}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Predictions */}
      {deepDive.predictions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔮 What To Expect Next</Text>
          <View style={styles.card}>
            {deepDive.predictions.likelyOutcome && (
              <Text style={styles.predictionText}>{deepDive.predictions.likelyOutcome}</Text>
            )}
            {deepDive.predictions.recoveryTimeline && (
              <Text style={styles.timelineText}>⏱️ {deepDive.predictions.recoveryTimeline}</Text>
            )}
            {deepDive.predictions.monitorFor && (
              <Text style={styles.monitorText}>👀 Monitor: {deepDive.predictions.monitorFor}</Text>
            )}
          </View>
        </View>
      )}

      {/* Reassurance */}
      {deepDive.reassurance && (
        <View style={styles.section}>
          <View style={[styles.card, styles.reassuranceCard]}>
            {deepDive.reassurance.message && (
              <Text style={styles.reassuranceMessage}>{deepDive.reassurance.message}</Text>
            )}
            {deepDive.reassurance.context && (
              <Text style={styles.reassuranceContext}>{deepDive.reassurance.context}</Text>
            )}
            {deepDive.reassurance.encouragement && (
              <Text style={styles.reassuranceEncouragement}>{deepDive.reassurance.encouragement}</Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  headline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    lineHeight: 24,
  },
  bodyText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  highlight: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  highlightText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contributorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingRight: 40,
  },
  evidenceBox: {
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  evidenceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 6,
  },
  evidenceItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  mechanismText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  impactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginTop: 4,
  },
  notItem: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 8,
    fontWeight: '500',
  },
  approachText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionCard: {
    backgroundColor: '#F1F8E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  actionHeader: {
    marginBottom: 8,
  },
  actionPriority: {
    fontSize: 11,
    fontWeight: '600',
    color: '#388E3C',
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  actionWhy: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  actionHow: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  avoidBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  avoidTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 6,
  },
  avoidItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  predictionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  timelineText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 6,
  },
  monitorText: {
    fontSize: 14,
    color: '#388E3C',
  },
  reassuranceCard: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  reassuranceMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
    lineHeight: 24,
  },
  reassuranceContext: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  reassuranceEncouragement: {
    fontSize: 14,
    color: '#388E3C',
    fontWeight: '500',
  },
});
