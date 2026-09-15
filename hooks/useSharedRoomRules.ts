'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import {
  loadActivityRecords,
  upsertActivityRecord,
  type CoupleActivityRecord,
} from '@/lib/activity-records';
import { useSharedRecordsVersion } from './useSharedRecordsVersion';

export interface SharedRoomRules {
  allowCameraSurprise: boolean;
  allowDeepSurprise: boolean;
  allowGamesSurprise: boolean;
  allowCreativeSurprise: boolean;
  resurfacingEnabled: boolean;
  archivedKeepsakeIds: string[];
  resurfacingDisabledKeepsakeIds: string[];
  aiReuseDisabledKeepsakeIds: string[];
}

export const DEFAULT_SHARED_ROOM_RULES: SharedRoomRules = {
  allowCameraSurprise: true,
  allowDeepSurprise: true,
  allowGamesSurprise: true,
  allowCreativeSurprise: true,
  resurfacingEnabled: true,
  archivedKeepsakeIds: [],
  resurfacingDisabledKeepsakeIds: [],
  aiReuseDisabledKeepsakeIds: [],
};

function normalize(value?: Partial<SharedRoomRules>): SharedRoomRules {
  return {
    ...DEFAULT_SHARED_ROOM_RULES,
    ...value,
    archivedKeepsakeIds: [...new Set(value?.archivedKeepsakeIds || [])],
    resurfacingDisabledKeepsakeIds: [
      ...new Set(value?.resurfacingDisabledKeepsakeIds || []),
    ],
    aiReuseDisabledKeepsakeIds: [
      ...new Set(value?.aiReuseDisabledKeepsakeIds || []),
    ],
  };
}

export function useSharedRoomRules() {
  const { space } = useCoupleSpace();
  const sharedRecordsVersion = useSharedRecordsVersion();
  const [rules, setRules] = useState(DEFAULT_SHARED_ROOM_RULES);
  const [loading, setLoading] = useState(Boolean(space?.id));
  const [error, setError] = useState<string | null>(null);
  const recordRef = useRef<CoupleActivityRecord<SharedRoomRules> | null>(null);
  const rulesRef = useRef(DEFAULT_SHARED_ROOM_RULES);
  const queueRef = useRef(Promise.resolve());

  const reload = useCallback(async () => {
    if (!space?.id) {
      setRules(DEFAULT_SHARED_ROOM_RULES);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const records = await loadActivityRecords<SharedRoomRules>(
        space.id,
        'room_rules',
      );
      const record = records.find((item) => item.key === 'shared-rules') || null;
      recordRef.current = record;
      let nextRules = normalize(record?.payload);
      if (!record && typeof window !== 'undefined') {
        nextRules = normalize({
          allowCameraSurprise: localStorage.getItem('dearly_allow_camera_surprise') !== 'false',
          allowDeepSurprise: localStorage.getItem('dearly_allow_deep_surprise') !== 'false',
          allowGamesSurprise: localStorage.getItem('dearly_allow_games_surprise') !== 'false',
          allowCreativeSurprise: localStorage.getItem('dearly_allow_creative_surprise') !== 'false',
          resurfacingEnabled: localStorage.getItem('dearly_resurfacing_enabled') !== 'false',
          archivedKeepsakeIds: JSON.parse(localStorage.getItem('dearly_archived_keepsakes') || '[]'),
        });
        const saved = await upsertActivityRecord({
          coupleId: space.id,
          kind: 'room_rules',
          key: 'shared-rules',
          title: 'Your Room, Your Rules',
          payload: nextRules,
          expectedRevision: null,
        });
        recordRef.current = saved;
        for (const key of [
          'dearly_allow_camera_surprise',
          'dearly_allow_deep_surprise',
          'dearly_allow_games_surprise',
          'dearly_allow_creative_surprise',
          'dearly_resurfacing_enabled',
          'dearly_archived_keepsakes',
        ]) localStorage.removeItem(key);
      }
      rulesRef.current = nextRules;
      setRules(nextRules);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load shared rules.');
    } finally {
      setLoading(false);
    }
  }, [space?.id]);

  useEffect(() => {
    void reload();
  }, [reload, sharedRecordsVersion]);

  const updateRules = useCallback(
    (patch: Partial<SharedRoomRules>) => {
      if (!space?.id) return Promise.resolve();
      const optimistic = normalize({ ...rulesRef.current, ...patch });
      rulesRef.current = optimistic;
      setRules(optimistic);
      queueRef.current = queueRef.current.then(async () => {
        try {
          const saved = await upsertActivityRecord({
            coupleId: space.id,
            kind: 'room_rules',
            key: 'shared-rules',
            title: 'Your Room, Your Rules',
            payload: optimistic,
            expectedRevision: recordRef.current?.revision ?? null,
          });
          recordRef.current = saved;
          rulesRef.current = normalize(saved.payload);
          setRules(rulesRef.current);
          setError(null);
        } catch (cause) {
          await reload();
          setError(cause instanceof Error ? cause.message : 'Could not save shared rules.');
        }
      });
      return queueRef.current;
    },
    [reload, space?.id],
  );

  return { rules, loading, error, updateRules, reload };
}
