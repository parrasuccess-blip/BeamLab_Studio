(async () => {
  const endpoint = '/api/tutor';
  window.BeamLabTutorApi = {
    available: false,
    ask: async payload => {
      if(!window.BeamLabTutorApi.available) throw new Error('The online tutor is not connected. Deterministic Show Why remains available.');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000)
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
  if(!/^https?:$/.test(location.protocol)) return;
  try {
    const response=await fetch(endpoint,{signal:AbortSignal.timeout(5000)});
    const status=await response.json();
    window.BeamLabTutorApi.available=response.ok && status.configured===true;
  } catch { /* Offline teaching and analysis remain available. */ }
  window.dispatchEvent(new Event('beamlab:tutor-status'));
})().catch(() => { window.BeamLabTutorApi = null; });
