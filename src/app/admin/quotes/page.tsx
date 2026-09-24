'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { Plus, Quote, FilePenLine } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminDialog } from '@/components/admin/AdminDialog';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { db } from '@/lib/firebase';
import { sortQuotes, type MotivationQuote } from '@/lib/motivationQuotes';
import { saveMotivationQuote } from '@/lib/quoteTransactions';

export default function QuotesPage() {
  return <AdminProtectedRoute requiredPermission={{ resource: 'content', action: 'read' }}>
    <AdminLayout currentPage="/admin/quotes"><QuoteLibrary /></AdminLayout>
  </AdminProtectedRoute>;
}

function QuoteLibrary() {
  const { hasPermission } = useAdminAuth();
  const [quotes, setQuotes] = useState<MotivationQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState('all');
  const [editor, setEditor] = useState<MotivationQuote | 'new' | null>(null);
  useEffect(() => {
    setLoading(true);
    setError(false);
    return onSnapshot(collection(db, 'motivation_quotes'), snapshot => {
      setQuotes(sortQuotes(snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as MotivationQuote)));
      setLoading(false);
    }, () => { setError(true); setLoading(false); });
  }, [attempt]);
  const visible = quotes.filter(quote => filter === 'all' || quote.status === filter);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-bold">Motivation Quotes</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A little encouragement on the home page. Write in Sinhala, English, or both, with an optional author.</p></div>
      {hasPermission('content', 'create') && <Button onClick={() => setEditor('new')}><Plus size={18} className="mr-2" />New quote</Button>}
    </header>
    <p className="rounded-2xl border border-border bg-muted/40 p-5 text-sm leading-relaxed">
      Published quotes loop in ascending order, one every four hours, on the same schedule for everyone. Slots change at 00:00, 04:00, 08:00, 12:00, 16:00 and 20:00 UTC. Publishing, archiving or reordering may change the current quote immediately. Archive a quote to remove it from the loop; drafts remain private.
    </p>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium">{quotes.filter(quote => quote.status === 'published').length} published quotes</p>
      <label className="flex items-center gap-2 text-sm">Status
        <select value={filter} onChange={event => setFilter(event.target.value)} className="min-h-11 rounded-xl border border-border bg-background px-3">
          {['all', 'published', 'draft', 'archived'].map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
    </div>
    {error ? <div role="alert" className="app-card space-y-3 p-5"><p>Could not load quotes.</p><Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Retry</Button></div>
      : loading ? <p role="status">Loading quotes…</p>
      : !visible.length ? <div className="app-card space-y-3 p-8 text-center"><Quote className="mx-auto text-primary" size={32} /><h2 className="font-semibold">{quotes.length ? 'No quotes in this view' : 'Create your first quote'}</h2><p className="text-sm text-muted-foreground">Only published quotes appear on the home page.</p></div>
      : <ul className="app-card divide-y divide-border overflow-hidden">{visible.map(quote => <li key={quote.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs capitalize text-muted-foreground">{quote.status} · Order {quote.order}</p>
          {quote.textSi && <p lang="si" className="whitespace-pre-wrap break-words leading-relaxed">{quote.textSi}</p>}
          {quote.textEn && <p lang="en" className="whitespace-pre-wrap break-words leading-relaxed">{quote.textEn}</p>}
          {quote.author && <p className="break-words text-sm text-muted-foreground">— {quote.author}</p>}
        </div>
        {hasPermission('content', 'update') && <Button variant="outline" onClick={() => setEditor(quote)}><FilePenLine size={16} className="mr-2" />Edit</Button>}
      </li>)}</ul>}
    {editor && <QuoteEditor key={typeof editor === 'string' ? editor : editor.id} original={editor === 'new' ? undefined : editor} nextOrder={Math.min(999, Math.max(0, ...quotes.map(quote => quote.order)) + 1)} onClose={() => setEditor(null)} />}
  </div>;
}

function QuoteEditor({ original, nextOrder, onClose }: { original?: MotivationQuote; nextOrder: number; onClose: () => void }) {
  const { adminUser } = useAdminAuth();
  const [textEn, setTextEn] = useState(original?.textEn || '');
  const [textSi, setTextSi] = useState(original?.textSi || '');
  const [author, setAuthor] = useState(original?.author || '');
  const [order, setOrder] = useState(original?.order ?? nextOrder);
  const [status, setStatus] = useState<MotivationQuote['status']>(original?.status || 'draft');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!adminUser || busy) return;
    if (!textEn.trim() && !textSi.trim()) { setError('Enter a quote in at least one language.'); return; }
    setBusy(true);
    setError('');
    try {
      await saveMotivationQuote(db, adminUser.id, { textEn, textSi, author, order, status }, original);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error && failure.message === 'conflict'
        ? 'Another admin changed this quote. Close and reopen it to review the latest version.'
        : 'Could not save. Check your connection and permissions, then try again.');
    } finally { setBusy(false); }
  }
  const field = 'mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground';
  return <AdminDialog title={original ? 'Edit quote' : 'New quote'} busy={busy} onClose={onClose}>
    <form onSubmit={save} className="space-y-5">
      <fieldset disabled={busy} className="space-y-5">
        <p className="text-sm text-muted-foreground">Enter at least one language. If a translation is missing, users see the available version.</p>
        <label className="block text-sm font-medium">Sinhala quote<textarea lang="si" rows={4} maxLength={1200} value={textSi} onChange={event => setTextSi(event.target.value)} className={field} /></label>
        <label className="block text-sm font-medium">English quote<textarea lang="en" rows={4} maxLength={1200} value={textEn} onChange={event => setTextEn(event.target.value)} className={field} /></label>
        <label className="block text-sm font-medium">Author / source (optional)<input maxLength={160} value={author} onChange={event => setAuthor(event.target.value)} className={field} /></label>
        <label className="block text-sm font-medium">Rotation order<input required type="number" min={0} max={999} step={1} value={order} onChange={event => setOrder(event.target.valueAsNumber)} className={field} /></label>
        <label className="block text-sm font-medium">Status<select value={status} onChange={event => setStatus(event.target.value as MotivationQuote['status'])} className={field}>
          <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </select></label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save quote'}</Button></div>
    </form>
  </AdminDialog>;
}
