'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/navigation';
import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);

  useEffect(() => {
    const getLinkToken = async () => {
      setError(null);
      try {
        const data = await createLinkToken(user);
        if (data?.error) {
          setError(data.error);
          console.error("PlaidLink token error:", data.error);
          return;
        }
        setToken(data?.linkToken ?? "");
      } catch (err) {
        setError("Failed to initialize bank connection");
        console.error("PlaidLink init error:", err);
      }
    }

    if (user?.$id) {
      getLinkToken();
    }
  }, [user]);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
    setIsExchanging(true);
    setError(null);
    try {
      const result = await exchangePublicToken({
        publicToken: public_token,
        user,
      });

      if (result?.error) {
        setError(result.error);
        setIsExchanging(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setError("Failed to link bank account");
      setIsExchanging(false);
      console.error("PlaidLink exchange error:", err);
    }
  }, [user, router]);

  const config: PlaidLinkOptions = {
    token,
    onSuccess
  }

  const { open, ready } = usePlaidLink(config);

  const buttonDisabled = !ready || isExchanging;
  const buttonContent = isExchanging ? (
    <>
      <Loader2 size={16} className="animate-spin mr-2" />
      Linking...
    </>
  ) : (
    'Connect bank'
  );

  return (
    <div className="flex flex-col gap-2">
      {variant === 'primary' ? (
        <Button
          onClick={() => open()}
          disabled={buttonDisabled}
          className="plaidlink-primary"
        >
          {buttonContent}
        </Button>
      ) : variant === 'ghost' ? (
        <Button onClick={() => open()} disabled={buttonDisabled} variant="ghost" className="plaidlink-ghost">
          <Image
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={24}
            height={24}
          />
          <p className='hidden text-[16px] font-semibold text-black-2 xl:block'>Connect bank</p>
        </Button>
      ) : (
        <Button onClick={() => open()} disabled={buttonDisabled} className="plaidlink-default">
          <Image
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={24}
            height={24}
          />
          <p className='text-[16px] font-semibold text-black-2'>Connect bank</p>
        </Button>
      )}

      {error && (
        <p className="text-12 text-red-500 px-1">{error}</p>
      )}
    </div>
  )
}

export default PlaidLink
