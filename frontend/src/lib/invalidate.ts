import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from './api';

/**
 * A human decision (approval, finding or risk review, classification) can move a run forward and
 * changes findings, the system's risk class, assessment documents and every compliance roll-up
 * (overview, framework modules, graph) — refresh all of them.
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
    void qc.invalidateQueries({ queryKey: qk.frameworksAll(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.obligationsAll(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.soa(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.nistScorecard(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.assessmentsAll(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.graph(workspaceId) });
    void qc.invalidateQueries({ queryKey: ['audit'] });
  }, [qc, workspaceId]);
}
