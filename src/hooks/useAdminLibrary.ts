"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { lessonsFromIds } from "@/lib/learning";
import { db } from "@/lib/firebase";

export type LibraryRecord = DocumentData & { id: string };
/** Stable document-ID pagination needs no new composite indexes. Search is explicitly over loaded rows. */
export function useAdminLibrary(
  name: "dhamma_posts" | "kamatahan_audio" | "teachers" | "learning_paths",
  status: string,
) {
  const [records, setRecords] = useState<LibraryRecord[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [hasMore, setHasMore] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const cursor = useRef<QueryDocumentSnapshot | undefined>(undefined),
    generation = useRef(0),
    busy = useRef(false);
  const load = useCallback(
    async (reset: boolean, epoch: number) => {
      if (busy.current && !reset) return;
      busy.current = true;
      setLoading(true);
      setError("");
      try {
        const constraints = [
          ...(status === "all" ? [] : [where("status", "==", status)]),
          orderBy(documentId()),
          ...(reset || !cursor.current ? [] : [startAfter(cursor.current)]),
          limit(20),
        ];
        const result = await getDocs(
          query(collection(db, name), ...constraints),
        );
        if (epoch !== generation.current) return;
        const rows = result.docs.map((snapshot) => ({
          ...snapshot.data(),
          id: snapshot.id,
          ...(name === "learning_paths"
            ? { lessons: lessonsFromIds(snapshot.data().lessonIds) }
            : {}),
        }));
        setRecords((previous) => (reset ? rows : [...previous, ...rows]));
        cursor.current = result.docs.at(-1);
        setHasMore(result.size === 20);
      } catch (error) {
        if (epoch === generation.current)
          setError(
            error instanceof Error
              ? error.message
              : "The library could not load.",
          );
      } finally {
        if (epoch === generation.current) {
          busy.current = false;
          setLoading(false);
        }
      }
    },
    [name, status],
  );
  useEffect(() => {
    const epoch = ++generation.current;
    cursor.current = undefined;
    setRecords([]);
    setHasMore(false);
    void load(true, epoch);
    return () => {
      generation.current = epoch + 1;
    };
  }, [load, refresh]);
  return {
    records,
    loading,
    error,
    hasMore,
    loadMore: () => load(false, generation.current),
    reload: () => setRefresh((value) => value + 1),
  };
}
