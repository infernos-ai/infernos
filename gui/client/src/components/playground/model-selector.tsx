
import { Cpu } from "lucide-react";

export function ModelSelector() {
  // Since we haven't added shadcn Select yet, we'll just use a native select styled properly for now 
  // or a placeholder if we want to run `shadcn add select` later. For UI-3, a styled native select is fine.
  return (
    <div className="flex items-center gap-2">
      <Cpu className="w-4 h-4 text-muted-foreground" />
      <select className="h-8 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
        <option value="llama3.2">llama3.2</option>
        <option value="mistral">mistral</option>
        <option value="qwen2">qwen2</option>
      </select>
    </div>
  );
}
