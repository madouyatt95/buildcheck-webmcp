import { ScanSearch } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand" aria-label="BuildCheck">
      <span className="brand-mark"><ScanSearch aria-hidden="true" /></span>
      {!compact && <span>BuildCheck</span>}
    </span>
  );
}
