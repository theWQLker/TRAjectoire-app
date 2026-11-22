"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
import {
  QUIT_ONLY,
  QUIT_SAVE,
  QUIT_WARNING,
  getDraftState,
  getServerDraftState,
  setDraftState,
  storageWorks,
  subscribeDraftState,
} from "./draft";

/**
 * The quiz header's way out. Answers are already saved on this device as they
 * are given (./draft.ts), so leaving keeps them: « Quitter et enregistrer ».
 * When this browser refuses storage, it reads « Quitter » and, if anything was
 * answered, asks before the answers are lost.
 */
export function QuitLink() {
  const { storage, answered } = useSyncExternalStore(subscribeDraftState, getDraftState, getServerDraftState);
  useEffect(() => {
    if (getDraftState().storage === null) setDraftState({ storage: storageWorks() });
  }, []);
  const saves = storage !== false;
  return (
    <Link
      href="/"
      onClick={(e) => {
        if (!saves && answered > 0 && !window.confirm(QUIT_WARNING)) e.preventDefault();
      }}
      className="inline-flex min-h-11 items-center gap-1.5 text-muted hover:text-navy"
    >
      <ArrowLeft size={15} strokeWidth={1.5} />
      {saves ? QUIT_SAVE : QUIT_ONLY}
    </Link>
  );
}
