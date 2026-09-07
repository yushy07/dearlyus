'use client';

import { useState, useCallback } from 'react';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import {
  uploadKeepsake,
  deleteKeepsake,
  saveDateNightCapsule,
  type Keepsake,
} from '@/lib/account';

export interface SaveKeepsakeInput {
  kind: Keepsake['kind'];
  title: string;
  file?: File | Blob;
  activityPath?: string;
  caption?: string;
  metadata?: Record<string, unknown>;
}

export function useKeepsakeWriter() {
  const { space, refresh } = useCoupleSpace();
  const { sessionId } = useActivitySession();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveKeepsake = useCallback(
    async (input: SaveKeepsakeInput) => {
      if (!space?.id)
        throw new Error('Couple space is required to save a keepsake.');
      setSaving(true);
      setError(null);

      try {
        const saved = await uploadKeepsake({
          coupleId: space.id,
          kind: input.kind,
          title: input.title,
          file: input.file,
          activityPath: input.activityPath,
          sessionId: sessionId || undefined,
          caption: input.caption,
          metadata: input.metadata,
        });
        await refresh();
        return saved;
      } catch (err: any) {
        const msg = err?.message || 'Failed to save keepsake.';
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [space?.id, sessionId, refresh],
  );

  const removeKeepsake = useCallback(
    async (id: string) => {
      setDeleting(true);
      setError(null);
      try {
        const res = await deleteKeepsake(id);
        await refresh();
        return res;
      } catch (err: any) {
        const msg = err?.message || 'Failed to delete keepsake.';
        setError(msg);
        throw err;
      } finally {
        setDeleting(false);
      }
    },
    [refresh],
  );

  const saveCapsule = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!space?.id)
        throw new Error(
          'Couple space is required to save a date night capsule.',
        );
      setSaving(true);
      setError(null);
      try {
        const res = await saveDateNightCapsule(space.id, payload);
        await refresh();
        return res;
      } catch (err: any) {
        const msg = err?.message || 'Failed to save date night capsule.';
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [space?.id, refresh],
  );

  return {
    saveKeepsake,
    removeKeepsake,
    saveCapsule,
    saving,
    deleting,
    error,
  };
}
