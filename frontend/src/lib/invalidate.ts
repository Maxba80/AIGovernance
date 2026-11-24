import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from './api';

/**
 * A human decision (approval, finding or risk review, classification) can move a run forward and
 * changes findings, the system's risk class and the compliance roll-up — refresh all of them.
 */
export function useInvalidateGovernance(workspaceId: string): () => void {
  const qc = useQueryClient();
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: qk.approvals(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.systems(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.runsAll(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.findingsAll(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.risksAll(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.compliance(workspaceId) });
    void qc.invalidateQueries({ queryKey: ['audit'] });
  }, [qc, workspaceId]);
}
