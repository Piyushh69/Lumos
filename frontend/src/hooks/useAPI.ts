import { useState, useEffect } from 'react';

export const useAPI = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API call logic here
    setLoading(false);
  }, [url]);

  return { data, loading, error };
};