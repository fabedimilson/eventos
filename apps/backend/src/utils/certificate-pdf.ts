import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface CertificatePdfData {
  userName: string;
  userCpf?: string | null;
  eventTitle: string;
  totalHours: number;
  validationCode: string;
  sha256Hash: string;
  issuedAt: string;
}

export async function createCertificatePdfBuffer(data: CertificatePdfData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 40,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Fundo e Bordas Estilizadas
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(4)
        .stroke('#1B5E20'); // Verde IFAM

      doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56)
        .lineWidth(1)
        .stroke('#C62828'); // Vermelho IFAM

      // Cabeçalho Institucional
      doc.font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#1B5E20')
        .text('INSTITUTO FEDERAL DO AMAZONAS', { align: 'center' });

      doc.moveDown(0.2);
      doc.font('Helvetica')
        .fontSize(12)
        .fillColor('#555555')
        .text('DIRETORIA DE EXTENSÃO E EVENTOS ACADÊMICOS', { align: 'center' });

      doc.moveDown(1.5);
      doc.font('Helvetica-Bold')
        .fontSize(32)
        .fillColor('#111827')
        .text('CERTIFICADO DE PARTICIPAÇÃO', { align: 'center' });

      doc.moveDown(1.2);
      doc.font('Helvetica')
        .fontSize(16)
        .fillColor('#374151')
        .text(
          `Certificamos que ${data.userName.toUpperCase()}${data.userCpf ? `, portador(a) do CPF nº ${data.userCpf}` : ''}, participou com êxito do evento acadêmico "${data.eventTitle}", perfazendo a carga horária total de ${data.totalHours.toFixed(1)} horas de atividades complementares.`,
          {
            align: 'center',
            lineGap: 6,
          }
        );

      doc.moveDown(1.5);
      const formattedDate = new Date(data.issuedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      doc.fontSize(12)
        .fillColor('#6B7280')
        .text(`Manaus - AM, ${formattedDate}`, { align: 'center' });

      // QR Code de Validação Pública
      const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
      const validationUrl = `${frontendUrl}/validar?code=${data.validationCode}`;
      const qrDataUrl = await QRCode.toDataURL(validationUrl, { margin: 1 });
      const qrImageBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

      const qrY = doc.page.height - 130;
      doc.image(qrImageBuffer, 50, qrY, { width: 70 });

      doc.fontSize(8)
        .fillColor('#4B5563')
        .text(`Código de Validação: ${data.validationCode}`, 130, qrY + 10)
        .text(`Autenticidade SHA-256: ${data.sha256Hash.substring(0, 32)}...`, 130, qrY + 25)
        .text(`Consulte a autenticidade deste documento em: ${validationUrl}`, 130, qrY + 40);

      // Assinatura
      doc.moveTo(doc.page.width - 250, qrY + 30)
        .lineTo(doc.page.width - 50, qrY + 30)
        .lineWidth(1)
        .stroke('#1B5E20');

      doc.fontSize(10)
        .fillColor('#111827')
        .text('Comissão Organizadora de Eventos', doc.page.width - 250, qrY + 35, { width: 200, align: 'center' })
        .fontSize(8)
        .fillColor('#6B7280')
        .text('IFAM - Ministério da Educação', doc.page.width - 250, qrY + 48, { width: 200, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
