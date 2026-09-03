import { jsPDF } from 'jspdf';

export interface CertificatePdfOptions {
  userName: string;
  userCpf?: string | null;
  eventTitle: string;
  totalHours: number;
  validationCode: string;
  sha256Hash?: string;
  issuedAt?: string;
}

export async function generateClientCertificatePdf(options: CertificatePdfOptions) {
  const {
    userName,
    userCpf,
    eventTitle,
    totalHours,
    validationCode,
    sha256Hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    issuedAt = new Date().toISOString(),
  } = options;

  // Cria documento A4 Paisagem (Landscape: 297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297
  const pageHeight = doc.internal.pageSize.getHeight(); // 210

  // 1. Moldura Verde IFAM (Externa)
  doc.setDrawColor(27, 94, 32); // #1B5E20
  doc.setLineWidth(1.5);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // 2. Moldura Vermelha IFAM (Interna)
  doc.setDrawColor(198, 40, 40); // #C62828
  doc.setLineWidth(0.5);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

  // 3. Cabeçalho Institucional
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(27, 94, 32);
  doc.text('INSTITUTO FEDERAL DO AMAZONAS', pageWidth / 2, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(85, 85, 85);
  doc.text('DIRETORIA DE EXTENSÃO E EVENTOS ACADÊMICOS', pageWidth / 2, 35, { align: 'center' });

  // 4. Título Principal do Certificado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(17, 24, 39);
  doc.text('CERTIFICADO DE PARTICIPAÇÃO', pageWidth / 2, 54, { align: 'center' });

  // 5. Texto de Certificação com Quebra de Linha Automática
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(55, 65, 81);

  const cpfText = userCpf ? `, portador(a) do CPF nº ${userCpf}` : '';
  const fullText = `Certificamos que ${userName.toUpperCase()}${cpfText}, participou com êxito do evento acadêmico "${eventTitle}", perfazendo a carga horária total de ${totalHours.toFixed(1)} horas de atividades complementares.`;

  const splitText = doc.splitTextToSize(fullText, pageWidth - 60);
  doc.text(splitText, pageWidth / 2, 75, { align: 'center', lineHeightFactor: 1.4 });

  // 6. Data de Emissão
  const formattedDate = new Date(issuedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Manaus - AM, ${formattedDate}`, pageWidth / 2, 122, { align: 'center' });

  // 7. Bloco Inferior: Validação e Assinatura
  const qrY = 145;

  // Código de Validação & Hash SHA-256
  const host = typeof window !== 'undefined' ? window.location.origin : 'https://ifam-eventos.vercel.app';
  const validationUrl = `${host}/validar?code=${validationCode}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(`Código de Validação: ${validationCode}`, 20, qrY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(`Autenticidade SHA-256: ${sha256Hash.substring(0, 36)}...`, 20, qrY + 14);
  doc.text(`Validação pública: ${validationUrl}`, 20, qrY + 20);

  // Linha de Assinatura Institucional
  const sigX = pageWidth - 90;
  doc.setDrawColor(27, 94, 32);
  doc.setLineWidth(0.5);
  doc.line(sigX, qrY + 10, sigX + 70, qrY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text('Comissão Organizadora de Eventos', sigX + 35, qrY + 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('IFAM - Ministério da Educação', sigX + 35, qrY + 21, { align: 'center' });

  // 8. Gera o PDF em Blob e força o download e abertura nativa no navegador
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  if (typeof window !== 'undefined') {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Certificado-IFAM-${validationCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Abre também em nova aba para visualização direta se desejado
    setTimeout(() => {
      window.open(blobUrl, '_blank');
    }, 200);
  } else {
    doc.save(`Certificado-IFAM-${validationCode}.pdf`);
  }
}
