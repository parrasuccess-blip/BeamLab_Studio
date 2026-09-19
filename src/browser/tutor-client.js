(async () => {
  const endpoint = '/api/tutor';
  window.BeamLabTutorApi = {
    ask: async payload => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data = null;
      try { data = await response.json(); } catch {}
      if (!response.ok) {
        const message = data && typeof data.error === 'string' ? data.error : 'The tutor is temporarily unavailable.';
        throw new Error(message);
      }
      return data;
    }
  };
})().catch(() => { window.BeamLabTutorApi = null; });
