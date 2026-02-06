"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = "idle" | "ok" | "error";

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function runTest() {
      try {
        const supabase = getSupabaseBrowserClient();

        // Simple test query – works even if the table is empty
        const { error } = await supabase.from("profiles").select("id").limit(1);

        if (error) {
          console.error("Supabase test error:", error);
          setStatus("error");
          setMessage(error.message);
        } else {
          setStatus("ok");
        }
      } catch (err) {
        console.error("Supabase connection error:", err);
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Unknown error");
      }
    }

    runTest();
  }, []);

  if (status === "idle") {
    return null;
  }

  return (
    <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700">
      <span
        className={`h-2 w-2 rounded-full ${
          status === "ok" ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span>
        Supabase:{" "}
        {status === "ok"
          ? "Connected"
          : "Error – check console / Supabase configuration"}
      </span>
      {status === "error" && message && (
        <span className="ml-1 text-[10px] text-gray-500 max-w-[200px] truncate">
          ({message})
        </span>
      )}
    </div>
  );
}

