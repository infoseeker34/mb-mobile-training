import { useState, useCallback } from 'react';

const useApiCall = (asyncFn, options = {}) => {
  const { onSuccess, onError } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setData(result);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'An error occurred';
      setError(errorMessage);
      if (onError) onError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
};

export default useApiCall;
