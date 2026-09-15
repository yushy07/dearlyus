'use client';

import { useEffect, useState } from 'react';

export function useSharedRecordsVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('dearly_shared_records_changed', refresh);
    return () =>
      window.removeEventListener('dearly_shared_records_changed', refresh);
  }, []);
  return version;
}
