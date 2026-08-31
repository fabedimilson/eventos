import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Clock, User, QrCode, Tv, Award, ArrowLeft } from 'lucide-react-native';

export default function MobileSessionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Player de Vídeo YouTube Live / On-Demand */}
      <View style={styles.videoContainer}>
        <WebView
          style={styles.webview}
          source={{ uri: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }}
          allowsFullscreenVideo
        />
        <View style={styles.liveIndicator}>
          <Tv color="#FFFFFF" size={12} />
          <Text style={styles.liveText}>Transmissão Ao Vivo</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.sessionTitle}>
            Keynote de Abertura: O Futuro da IA e Bioinformática na Amazônia
          </Text>
          <View style={styles.badgeHour}>
            <Award color="#1B5E20" size={14} />
            <Text style={styles.hourText}>2.0h certificadas</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Apresentação sobre modelos neurais de preservação florestal e processamento massivo de dados genômicos no bioma amazônico.
        </Text>

        <View style={styles.speakerCard}>
          <User color="#1B5E20" size={20} />
          <View>
            <Text style={styles.speakerName}>Dra. Helena Tavares (INPA/IFAM)</Text>
            <Text style={styles.speakerBio}>Pesquisadora sênior em bioinformática e dados</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkInBtn}
          onPress={() => router.push('/(tabs)/scanner')}
        >
          <QrCode color="#FFFFFF" size={18} />
          <Text style={styles.checkInBtnText}>Abrir Leitor de QR Code para Check-in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  videoContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  liveIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#C62828',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 10,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 22,
  },
  badgeHour: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  hourText: {
    fontSize: 11,
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 20,
  },
  speakerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  speakerBio: {
    fontSize: 11,
    color: '#64748B',
  },
  checkInBtn: {
    backgroundColor: '#1B5E20',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1B5E20',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  checkInBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
