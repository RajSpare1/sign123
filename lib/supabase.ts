'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 100,
    },
  },
});

export type SignatureSession = {
  id: string;
  session_code: string;
  signature_data: string | null;
  status: 'pending' | 'connected' | 'completed';
  created_at: string;
  updated_at: string;
};

export const generateSessionCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createSession = async (sessionCode: string): Promise<SignatureSession | null> => {
  const { data, error } = await supabase
    .from('signature_sessions')
    .insert({ session_code: sessionCode } as any)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating session:', error);
    return null;
  }

  return data as SignatureSession;
};

export const getSessionByCode = async (sessionCode: string): Promise<SignatureSession | null> => {
  const { data, error } = await supabase
    .from('signature_sessions')
    .select('*')
    .eq('session_code', sessionCode)
    .maybeSingle();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return data as SignatureSession;
};

export const updateSessionStatus = async (sessionCode: string, status: string): Promise<void> => {
  await supabase
    .from('signature_sessions')
    .update({ status } as any)
    .eq('session_code', sessionCode);
};

export const submitSignature = async (sessionCode: string, signatureData: string): Promise<void> => {
  await supabase
    .from('signature_sessions')
    .update({
      signature_data: signatureData,
      status: 'completed'
    } as any)
    .eq('session_code', sessionCode);
};

export const subscribeToSession = (
  sessionCode: string,
  onSignatureReceived: (signatureData: string) => void
) => {
  const channel = supabase
    .channel(`session-${sessionCode}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'signature_sessions',
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => {
        const newData = payload.new as SignatureSession;
        if (newData.signature_data && newData.status === 'completed') {
          onSignatureReceived(newData.signature_data);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
