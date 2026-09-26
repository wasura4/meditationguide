"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import {
  ArrowRight,
  Flower2,
  RefreshCw,
  Search,
  Users,
  UserRound,
  Route,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminService } from "@/lib/adminService";
import type { User } from "@/types";
import { UserProfileDrawer } from "@/components/admin/UserProfileDrawer";
import ui from "../analytics/analytics.module.css";
import styles from "./users.module.css";

const formatDate = (date?: Date) =>
  date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not recorded";
const name = (user: User) =>
  (user.displayName && user.displayName !== "Anonymous User"
    ? user.displayName
    : user.email?.split("@")[0]) || "Unnamed member";

export default function AdminUsersPage() {
  const { hasPermission } = useAdminAuth();
  const canRead = hasPermission("users", "read");
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<User | null>(null);
  const cursor = useRef<QueryDocumentSnapshot | undefined>(undefined);
  const request = useRef(0);
  const fetchingMore = useRef(false);
  const closeProfile = useCallback(() => setSelected(null), []);
  useEffect(() => {
    if (!canRead) return;
    const id = ++request.current;
    setLoading(true);
    setError(false);
    setMoreError(false);
    setLoadingMore(false);
    fetchingMore.current = false;
    const timer = setTimeout(
      async () => {
        try {
          if (search.trim()) {
            const result = await AdminService.searchUsers(search.trim());
            if (id !== request.current) return;
            setUsers(result);
            setHasMore(false);
            cursor.current = undefined;
          } else {
            const result = await AdminService.getUsers(20);
            if (id !== request.current) return;
            setUsers(result.users);
            setHasMore(result.users.length === 20);
            cursor.current = result.lastDoc;
          }
        } catch {
          if (id === request.current) setError(true);
        } finally {
          if (id === request.current) setLoading(false);
        }
      },
      search.trim() ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      request.current = id + 1;
    };
  }, [canRead, search, retry]);
  async function loadMore() {
    if (loading || fetchingMore.current || !hasMore || search.trim()) return;
    const id = request.current;
    fetchingMore.current = true;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const result = await AdminService.getUsers(20, cursor.current);
      if (id !== request.current) return;
      setUsers((previous) => [
        ...previous,
        ...result.users.filter(
          (user) => !previous.some((existing) => existing.id === user.id),
        ),
      ]);
      cursor.current = result.lastDoc;
      setHasMore(result.users.length === 20);
    } catch {
      if (id === request.current) setMoreError(true);
    } finally {
      if (id === request.current) {
        setLoadingMore(false);
        fetchingMore.current = false;
      }
    }
  }
  const visible = users
    .filter(
      (user) =>
        filter === "all" ||
        (filter === "path"
          ? !!user.pathProgress
          : filter === "guest"
            ? user.isAnonymous
            : !user.isAnonymous),
    )
    .sort((a, b) =>
      sort === "name"
        ? name(a).localeCompare(name(b))
        : (Number.isFinite(b.createdAt.getTime()) ? b.createdAt.getTime() : 0) -
          (Number.isFinite(a.createdAt.getTime()) ? a.createdAt.getTime() : 0),
    );
  return (
    <AdminLayout currentPage="/admin/users">
      <div className={ui.dashboard}>
        <header className={ui.header}>
          <div>
            <p className={ui.eyebrow}>
              <Users size={14} /> PEOPLE BEHIND THE PRACTICE
            </p>
            <h1>
              Your community<span>.</span>
            </h1>
            <p className={ui.subtitle}>
              Every member has a story. Get to know the practice behind the
              profile.
            </p>
          </div>
          <button
            className={ui.button}
            disabled={loading || !canRead}
            onClick={() => setRetry((value) => value + 1)}
          >
            <RefreshCw size={15} className={loading ? ui.spin : ""} />
            Refresh members
          </button>
        </header>
        {!canRead ? (
          <p role="alert">You don&apos;t have permission to view members.</p>
        ) : (
          <>
            <section className={styles.intro}>
              <div className={styles.introIcon}>
                <Flower2 size={30} />
              </div>
              <div>
                <h2>A closer look at each journey</h2>
                <p>
                  Select a member to explore their practice history, milestones,
                  preferences, and account details.
                </p>
              </div>
              <span className={ui.badge}>Member directory</span>
            </section>
            <div className={styles.summary}>
              {[
                {
                  label: search.trim() ? "Search matches" : "Members loaded",
                  value: users.length,
                  icon: Users,
                },
                {
                  label: "Registered accounts in this list",
                  value: users.filter((user) => !user.isAnonymous).length,
                  icon: UserRound,
                },
                {
                  label: "With a recorded path stage",
                  value: users.filter((user) => user.pathProgress).length,
                  icon: Route,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label}>
                  <Icon size={19} />
                  <div>
                    <strong>
                      {loading || error ? "—" : value.toLocaleString()}
                    </strong>
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>
            <section className={`${ui.panel} ${styles.directory}`}>
              <div className={styles.controls}>
                <label className={styles.search}>
                  <Search size={18} />
                  <input
                    aria-label="Search members by name, email, or user ID"
                    placeholder="Search by name, email, or user ID…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search && (
                    <button
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X size={16} />
                    </button>
                  )}
                </label>
                <label className={styles.select}>
                  Show
                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                  >
                    <option value="all">All members</option>
                    <option value="registered">Registered accounts</option>
                    <option value="guest">Guest accounts</option>
                    <option value="path">With path progress</option>
                  </select>
                </label>
                <label className={styles.select}>
                  Sort
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </label>
              </div>
              <div className={styles.listHeading}>
                <h2>Member directory</h2>
                <span>
                  {search.trim()
                    ? "Search covers the full directory"
                    : "Filters and sorting apply to loaded members"}
                </span>
              </div>
              {loading ? (
                <div className={styles.loading} role="status">
                  Loading members…
                  {[0, 1, 2, 3, 4].map((value) => (
                    <div key={value} />
                  ))}
                </div>
              ) : error ? (
                <div className={ui.empty} role="alert">
                  <h3>We couldn&apos;t load your members</h3>
                  <p>Check your connection and try again.</p>
                  <button
                    className={ui.button}
                    onClick={() => setRetry((value) => value + 1)}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className={ui.tableScroll}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th scope="col">Member</th>
                          <th scope="col">Account</th>
                          <th scope="col">Path stage</th>
                          <th scope="col">Joined</th>
                          <th scope="col">Last recorded login</th>
                          <th scope="col">
                            <span className="sr-only">View profile</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((user) => (
                          <tr key={user.id} onClick={() => setSelected(user)}>
                            <td>
                              <button
                                className={styles.memberButton}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelected(user);
                                }}
                                aria-label={`View ${name(user)}'s profile`}
                              >
                                <span className={styles.avatar}>
                                  {name(user).slice(0, 1).toUpperCase()}
                                </span>
                                <span>
                                  <strong>{name(user)}</strong>
                                  <small>
                                    {user.email || "No email recorded"}
                                  </small>
                                </span>
                              </button>
                            </td>
                            <td>
                              <span className={styles.pill}>
                                {user.isAnonymous ? "Guest" : "Registered"}
                              </span>
                            </td>
                            <td>
                              {user.pathProgress ? (
                                <span className={styles.pathPill}>
                                  Stage {user.pathProgress.currentStage} / 8
                                </span>
                              ) : (
                                <span className={ui.muted}>Not recorded</span>
                              )}
                            </td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td>{formatDate(user.lastLoginAt)}</td>
                            <td>
                              <ArrowRight size={16} aria-hidden="true" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!visible.length && (
                    <div className={ui.empty}>
                      <Users size={28} />
                      <h3>No members found</h3>
                      <p>
                        {filter !== "all"
                          ? "Try another filter, or load more members below."
                          : search.trim()
                            ? "Try a different name, email, or user ID."
                            : "New members will appear here when they join."}
                      </p>
                      {(search || filter !== "all") && (
                        <button
                          className={ui.button}
                          onClick={() => {
                            setSearch("");
                            setFilter("all");
                          }}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                  <div className={styles.listFooter}>
                    <span>
                      Showing {visible.length} of {users.length}{" "}
                      {search.trim() ? "matching" : "loaded"} members
                    </span>
                    {hasMore && !search.trim() && (
                      <button
                        className={ui.button}
                        disabled={loadingMore}
                        onClick={loadMore}
                      >
                        {loadingMore
                          ? "Loading…"
                          : moreError
                            ? "Retry loading more"
                            : "Load more members"}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                  {moreError && (
                    <p role="alert" className={styles.error}>
                      More members couldn&apos;t load. Your current list is
                      still available.
                    </p>
                  )}
                </>
              )}
            </section>
            <p className={styles.footnote}>
              Member profiles are read-only. Practice totals are calculated from
              recorded sessions; path stages are self-reported.
            </p>
            {selected && (
              <UserProfileDrawer
                key={selected.id}
                user={selected}
                onClose={closeProfile}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
