"use client";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
export const adminInput =
  "min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring";
export function LibraryToolbar({
  search,
  onSearch,
  status,
  onStatus,
  statuses,
  onRefresh,
  loading,
}: {
  search: string;
  onSearch: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  statuses: string[];
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="app-card space-y-4 p-4">
      <div
        role="group"
        aria-label="Publication status"
        className="flex flex-wrap gap-2"
      >
        {["all", ...statuses].map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={status === value}
            onClick={() => onStatus(value)}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium capitalize ${status === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {value === "all"
              ? "All items"
              : value === "active"
                ? "Published"
                : value === "inactive"
                  ? "Hidden"
                  : value}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Search loaded items</span>
          <Search
            className="absolute left-3 top-3 text-muted-foreground"
            size={18}
          />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search loaded items…"
            className={`${adminInput} pl-10`}
          />
        </label>
        <Button
          variant="outline"
          disabled={loading}
          onClick={onRefresh}
          aria-label="Refresh library"
        >
          <RefreshCw size={18} />
        </Button>
      </div>
    </div>
  );
}
export function LibraryFooter({
  count,
  loaded,
  more,
  loading,
  onMore,
}: {
  count: number;
  loaded: number;
  more: boolean;
  loading: boolean;
  onMore: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-muted-foreground">
      <p>
        {count} shown · {loaded} loaded{more ? " · More items available" : ""}
      </p>
      {more && (
        <Button variant="outline" loading={loading} onClick={onMore}>
          Load more
        </Button>
      )}
    </div>
  );
}
