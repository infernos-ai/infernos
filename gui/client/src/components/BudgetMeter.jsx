export function BudgetMeter({ budgetSats, remainingSats }) {
  if (budgetSats == null || remainingSats == null) return null;

  const percentage = Math.max(0, Math.min(100, (remainingSats / budgetSats) * 100));
  const isLow = percentage < 20;

  return (
    <div className="flex flex-col gap-1 w-full max-w-[300px] text-xs text-muted-foreground">
      <div className="flex justify-between items-center">
        <span>Session Budget</span>
        <span className={`font-bold ${isLow ? 'text-error' : 'text-lightning'}`}>
          {remainingSats} / {budgetSats} SATS
        </span>
      </div>
      <div className="w-full h-1.5 bg-input rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ease-out ${isLow ? 'bg-error' : 'bg-success'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
