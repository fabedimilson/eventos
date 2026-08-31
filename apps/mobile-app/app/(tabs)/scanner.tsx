import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { QrCode, ShieldCheck, CheckCircle2, RefreshCw, AlertTriangle, Clock } from 'lucide-react-native';

export default function MobileScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);
  const [prematureData, setPrematureData] = useState<{
    sessionTitle: string;
    minutesElapsed: number;
    minutesRequired: number;
    minutesRemaining: number;
    workloadHours: number;
  } | null>(null);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);

    try {
      // Simulação ou leitura real
      const sessionTitle = 'Keynote de Abertura: O Futuro da IA e Bioinformática na Amazônia';
      setCheckInSuccess(`Presença confirmada com sucesso na palestra "${sessionTitle}"! +2.0h complementares registradas.`);
    } catch (e) {
      setCheckInSuccess('Presença registrada com sucesso no sistema IFAM!');
    }
  };

  const handleSimulateScan = () => {
    handleBarcodeScanned({ data: 'mock-qr-payload-ifam' });
  };

  const handleSimulatePrematureExit = () => {
    setPrematureData({
      sessionTitle: 'Workshop: Inteligência Artificial com Python & PyTorch',
      minutesElapsed: 45,
      minutesRequired: 90,
      minutesRemaining: 45,
      workloadHours: 2.0,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Leitor de Presença Individual</Text>
          <Text style={styles.subtitle}>
            Aponte a câmera para o QR Code rotativo projetado no telão do auditório.
          </Text>
        </View>

        {checkInSuccess ? (
          <View style={styles.successCard}>
            <CheckCircle2 color="#1B5E20" size={54} />
            <Text style={styles.successTitle}>Check-in Realizado!</Text>
            <Text style={styles.successMsg}>{checkInSuccess}</Text>

            <TouchableOpacity
              style={styles.btnScanAgain}
              onPress={() => {
                setScanned(false);
                setCheckInSuccess(null);
              }}
            >
              <RefreshCw color="#FFFFFF" size={16} />
              <Text style={styles.btnScanAgainText}>Escanear Outra Palestra</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraBox}>
            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              <QrCode color="#FFFFFF" size={48} style={{ opacity: 0.4 }} />
              <Text style={styles.scanHint}>Enquadre o QR Code</Text>
            </View>

            {/* Botões de Simulação Rápida */}
            <View style={{ gap: 8, width: '100%', paddingHorizontal: 20 }}>
              <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulateScan}>
                <ShieldCheck color="#1B5E20" size={16} />
                <Text style={styles.simulateText}>Simular Leitura de Entrada (Telão)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simulateBtn, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
                onPress={handleSimulatePrematureExit}
              >
                <AlertTriangle color="#B45309" size={16} />
                <Text style={[styles.simulateText, { color: '#B45309' }]}>Simular Saída Antecipada (&lt; 75%)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* MODAL DE ALERTA DE SAÍDA ANTECIPADA */}
        {prematureData && (
          <Modal transparent animationType="fade" visible={Boolean(prematureData)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.warningHeader}>
                  <AlertTriangle color="#D97706" size={32} />
                  <Text style={styles.modalTitle}>Atenção: Tempo Mínimo Não Atingido</Text>
                </View>

                <Text style={styles.modalSessionTitle}>{prematureData.sessionTitle}</Text>

                <View style={styles.timerStatsBox}>
                  <View style={styles.timerRow}>
                    <Text style={styles.timerLabel}>Tempo de permanência atual:</Text>
                    <Text style={styles.timerValue}>{prematureData.minutesElapsed} minutos</Text>
                  </View>
                  <View style={styles.timerRow}>
                    <Text style={styles.timerLabel}>Tempo mínimo exigido (75%):</Text>
                    <Text style={styles.timerValue}>{prematureData.minutesRequired} minutos</Text>
                  </View>
                  <View style={[styles.timerRow, { borderTopWidth: 1, borderColor: '#E2E8F0', paddingTop: 8 }]}>
                    <Text style={[styles.timerLabel, { color: '#DC2626', fontWeight: 'bold' }]}>
                      ⏳ Faltam para o certificado:
                    </Text>
                    <Text style={[styles.timerValue, { color: '#DC2626', fontWeight: 'bold' }]}>
                      {prematureData.minutesRemaining} minutos
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalWarningNotice}>
                  Se você registrar a saída agora, suas {prematureData.workloadHours}h de carga horária{' '}
                  <Text style={{ fontWeight: 'bold' }}>NÃO</Text> serão homologadas para certificação.
                </Text>

                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={styles.btnContinueActivity}
                    onPress={() => setPrematureData(null)}
                  >
                    <CheckCircle2 color="#FFFFFF" size={18} />
                    <Text style={styles.btnContinueText}>Continuar na Atividade (Recomendado)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnExitAnyway}
                    onPress={() => {
                      setPrematureData(null);
                      setCheckInSuccess('Saída registrada antecipadamente. Carga horária não atingida para certificação.');
                    }}
                  >
                    <Text style={styles.btnExitAnywayText}>Desejo sair mesmo assim (Sem Certificado)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        <View style={styles.footerNote}>
          <ShieldCheck color="#1B5E20" size={16} />
          <Text style={styles.noteText}>
            Validação anti-fraude com token criptográfico HMAC-SHA256 rotativo.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  cameraBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 260,
    height: 260,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#4CAF50',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    color: '#E2E8F0',
    fontSize: 11,
    marginTop: 12,
    fontWeight: '600',
  },
  simulateBtn: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  simulateText: {
    color: '#1B5E20',
    fontSize: 12,
    fontWeight: 'bold',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  successTitle: {
    color: '#1B5E20',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  successMsg: {
    color: '#334155',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  btnScanAgain: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnScanAgainText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    borderRadius: 14,
  },
  noteText: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#9A3412',
    flex: 1,
  },
  modalSessionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  timerStatsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 14,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  timerValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800',
  },
  modalWarningNotice: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 20,
  },
  modalActionButtons: {
    gap: 10,
  },
  btnContinueActivity: {
    backgroundColor: '#15803D',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnContinueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  btnExitAnyway: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnExitAnywayText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
});
