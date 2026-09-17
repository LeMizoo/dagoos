'use client';

import { useEffect, useState } from 'react';
import LandingLayout from '@/components/landing/LandingLayout';
import RegisterModal from '@/components/landing/RegisterModal';

export default function RegisterPage() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    setShowRegisterModal(true);
  }, []);

  return (
    <LandingLayout>
      <div className="min-h-screen" />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </LandingLayout>
  );
}
