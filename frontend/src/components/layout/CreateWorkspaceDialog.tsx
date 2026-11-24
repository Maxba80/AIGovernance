import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage, qk } from '../../lib/api';
import { useWorkspace } from '../../lib/workspace';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Overlay';
import { Field, Input, Textarea } from '../ui/Field';
import { Notice } from '../ui/Feedback';
import { useToast } from '../ui/Toast';

export function CreateWorkspaceDialog() {
  const { createOpen, closeCreate, select } = useWorkspace();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.createWorkspace(description.trim() ? { name: name.trim(), description: description.trim() } : { name: name.trim() }),
    onSuccess: async (w) => {
      await qc.invalidateQueries({ queryKey: qk.workspaces });
      select(w.id);
      toast.success(`Workspace “${w.name}” created`);
      closeCreate();
    },
  });

  useEffect(() => {
    if (createOpen) {
      setName('');
      setDescription('');
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) mutation.mutate();
  };

  return (
    <Dialog
      open={createOpen}
      onClose={closeCreate}
      title="New workspace"
      description="A workspace keeps the evidence, approvals and activity of one organisation or engagement separate."
      size="sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" htmlFor="ws-name">
          <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required maxLength={120} />
        </Field>
        <Field label="Description (optional)" htmlFor="ws-desc">
          <Textarea id="ws-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {mutation.isError && <Notice tone="error">{errorMessage(mutation.error)}</Notice>}
        <div className="flex justify-end gap-2">
          <Button onClick={closeCreate}>Cancel</Button>
          <Button type="submit" variant="primary" loading={mutation.isPending} disabled={!name.trim()}>
            Create workspace
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
