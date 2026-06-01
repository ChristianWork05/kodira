export const EMAIL_QUEUE_NAME = 'emails';
export const EMAIL_QUEUE = Symbol('EMAIL_QUEUE');

export type EmailJobName = 'sendVerifyEmail' | 'sendResetPassword';

export interface EmailQueue {
  add: (
    name: EmailJobName,
    data: Record<string, any>,
    opts?: { attempts?: number; removeOnComplete?: boolean },
  ) => Promise<unknown>;
}

