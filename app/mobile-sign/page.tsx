'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MobileSignLanding() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = sessionCode.trim().toUpperCase();

    if (!code || code.length < 6) {
      setError('Please enter a valid 6-character code');
      return;
    }

    router.push(`/mobile-sign/${code}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Pen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Mobile Signature</h1>
          <p className="text-muted-foreground">
            Sign documents from your mobile device with ease
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enter Session Code</CardTitle>
            <CardDescription>
              Enter the 6-character code shown on your computer screen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={sessionCode}
                onChange={(e) => {
                  setSessionCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Enter code (e.g., ABC123)"
                className="text-center text-2xl font-mono tracking-widest uppercase"
                maxLength={6}
              />
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full" size="lg">
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Alternatively, scan the QR code from your computer screen
          </p>
        </div>
      </div>
    </div>
  );
}
