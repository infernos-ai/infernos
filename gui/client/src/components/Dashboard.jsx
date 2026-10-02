import { useState, useEffect } from 'react';

export function Dashboard() {
  const [stats, setStats] = useState({ total_requests: 0, total_sats_earned: 0 });
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  const fetchTelemetry = async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch('/v1/node/stats'),
        fetch('/v1/node/config')
      ]);

      if (!statsRes.ok || !configRes.ok) throw new Error("Failed to fetch telemetry");

      const statsData = await statsRes.json();
      const configData = await configRes.json();

      setStats(statsData);
      setConfig(configData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm p-6 text-foreground">
      <h2 className="text-2xl font-bold mb-6 text-lightning flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        Operator Dashboard
      </h2>

      {error && (
        <div className="bg-error/10 border border-error text-error p-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Metric Card 1 */}
        <div className="bg-background border border-border/50 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
          <span className="text-muted-foreground text-sm font-medium">Total Revenue</span>
          <div className="text-4xl font-black text-primary">
            {stats.total_sats_earned} <span className="text-lg font-bold text-muted-foreground">SATS</span>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-background border border-border/50 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
          <span className="text-muted-foreground text-sm font-medium">Total API Requests</span>
          <div className="text-4xl font-black text-foreground">
            {stats.total_requests}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-border/40 pt-6">
        <h3 className="text-lg font-semibold mb-4">Node Configuration</h3>
        {config ? (
          <div className="bg-background border border-border/50 rounded-lg p-4 font-mono text-xs flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-border/30 pb-2">
              <span className="text-muted-foreground">Pricing Policy (Default)</span>
              <span className="text-lightning font-bold">{config.pricing.default_price_sats} SATS / prompt</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Upstream AI Engine</span>
              <span className="text-success truncate max-w-[200px] text-right">{config.upstream.url}</span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm animate-pulse">Loading config...</div>
        )}
      </div>
    </div>
  );
}
