import { useWebLN } from '../hooks/useWebLN';

export function WalletBadge() {
  const { isAvailable, enabled, enable } = useWebLN();

  if (!isAvailable) {
    return (
      <div className="px-3 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground flex items-center">
        No WebLN wallet detected. Fallback to manual QR invoice.
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border border-lightning rounded-lg bg-lightning/10 flex items-center gap-3 text-sm shadow-sm">
      <span className="text-lightning font-bold flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        WebLN Detected
      </span>
      {!enabled ? (
        <button 
          onClick={enable}
          className="ml-auto bg-lightning text-black border-none px-3 py-1 rounded hover:bg-lightning/80 cursor-pointer font-semibold transition-colors"
        >
          Connect
        </button>
      ) : (
        <span className="ml-auto text-success font-medium">Connected</span>
      )}
    </div>
  );
}
