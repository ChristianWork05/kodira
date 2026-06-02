import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { CERTIFICATE_QUEUE_NAME, type CertificateJobName } from './certificates.constants';

@Processor(CERTIFICATE_QUEUE_NAME)
export class CertificatesProcessor extends WorkerHost {
  async process(job: Job<Record<string, any>, unknown, CertificateJobName>) {
    if (job.name === 'generateCertificate') {
      return { ok: true };
    }
    return { ok: true };
  }
}

