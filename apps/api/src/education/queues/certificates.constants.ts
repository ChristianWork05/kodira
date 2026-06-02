export const CERTIFICATE_QUEUE_NAME = 'certificates';
export const CERTIFICATE_QUEUE = Symbol('CERTIFICATE_QUEUE');

export type CertificateJobName = 'generateCertificate';

export interface CertificateQueue {
  add: (
    name: CertificateJobName,
    data: Record<string, any>,
    opts?: { attempts?: number; removeOnComplete?: boolean },
  ) => Promise<unknown>;
}

