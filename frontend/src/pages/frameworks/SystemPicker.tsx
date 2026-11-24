import { Link } from 'react-router-dom';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Boxes } from 'lucide-react';
import { api, qk, type AiSystem } from '../../lib/api';
import { riskClassLabel } from '../../lib/grc';
import { Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/Feedback';

export function useSystems(workspaceId: string): UseQueryResult<AiSystem[]> {
  return useQuery({ queryKey: qk.systems(workspaceId), queryFn: () => api.listSystems(workspaceId), staleTime: 30_000 });
}

interface SystemPickerProps {
  id?: string;
  systems: AiSystem[];
  value: string;
  onChange: (id: string) => void;
  /** Show the current risk class next to each name. */
  withClass?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SystemPicker({ id, systems, value, onChange, withClass, placeholder = 'Choose a system or agent…', disabled, className }: SystemPickerProps) {
  const sorted = [...systems].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Select id={id} aria-label="System" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{placeholder}</option>
      {sorted.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
          {s.kind === 'agent' ? ' (agent)' : ''}
          {withClass ? ` — ${riskClassLabel(s.risk_class)}${s.risk_class && s.risk_class_status === 'proposed' ? ' (proposed)' : ''}` : ''}
        </option>
      ))}
    </Select>
  );
}

/** Loading / error / empty states of the inventory, for sections that need a system to be picked first. */
export function SystemsState({ query }: { query: UseQueryResult<AiSystem[]> }) {
  if (query.isLoading) return <SkeletonRows rows={2} />;
  if (query.isError) return <ErrorState compact error={query.error} title="Could not load the inventory" onRetry={() => void query.refetch()} />;
  if ((query.data ?? []).length === 0) {
    return (
      <EmptyState
        compact
        icon={<Boxes className="h-4 w-4" />}
        title="No AI systems registered yet"
        description="Register a system or agent in the inventory first."
        action={
          <Link to="/inventory" className="text-sm font-medium text-accent-text hover:underline">
            Open the inventory
          </Link>
        }
      />
    );
  }
  return null;
}
