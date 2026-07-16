import { Edit3, Heart, MessageCircle, MoreHorizontal, Plus, Send, Share2, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import type { CommunityPost, Modality } from '../../lib/types';

const modalities: Modality[] = ['Beach Tennis', 'Futevôlei', 'Society', 'Tênis', 'Vôlei', 'Basquete'];
const formatDateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium', timeStyle: 'short'
}).format(new Date(value));

const initialDraft = { id: '', content: '', type: 'COMUNIDADE', modality: '' as Modality | '' };

export function CommunityPage() {
  const { user } = useAuth();
  const {
    state,
    likePost,
    loadCommunityComments,
    removeCommunityComment,
    removeCommunityPost,
    saveCommunityComment,
    saveCommunityPost
  } = useAppData();
  const [draft, setDraft] = useState(initialDraft);
  const [postModal, setPostModal] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState('');
  const [deletePostId, setDeletePostId] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState('');
  const [visible, setVisible] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const sortedPosts = useMemo(
    () => [...state.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.posts]
  );
  const commentsPost = state.posts.find((post) => post.id === commentsPostId);
  const commentToDelete = commentsPost?.commentItems?.find((comment) => comment.id === deleteCommentId);
  if (!user) return null;

  const openCreate = () => {
    setDraft(initialDraft);
    setError('');
    setPostModal(true);
  };

  const openEdit = (post: CommunityPost) => {
    setDraft({ id: post.id, content: post.content, type: post.type, modality: post.modality ?? '' });
    setError('');
    setPostModal(true);
  };

  const submitPost = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await saveCommunityPost({
        id: draft.id || undefined,
        content: draft.content,
        type: draft.type,
        modality: draft.modality || undefined
      }, user);
      setPostModal(false);
      setToast(draft.id ? 'Publicação atualizada.' : 'Publicação criada com sucesso.');
      setDraft(initialDraft);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a publicação.');
    } finally {
      setSubmitting(false);
    }
  };

  const openComments = async (postId: string) => {
    setCommentsPostId(postId);
    setCommentText('');
    setEditingCommentId('');
    setError('');
    try {
      await loadCommunityComments(postId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os comentários.');
    }
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!commentsPostId || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await saveCommunityComment(commentsPostId, commentText, user, editingCommentId || undefined);
      setCommentText('');
      setEditingCommentId('');
      setToast(editingCommentId ? 'Comentário atualizado.' : 'Comentário publicado.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o comentário.');
    } finally {
      setSubmitting(false);
    }
  };

  const share = async (post: CommunityPost) => {
    const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    const payload = { title: 'Publicação na Comunidade PlaySpace', text: `${post.authorName}: ${post.content}`, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        setToast('Publicação compartilhada.');
      } else {
        await navigator.clipboard.writeText(`${payload.text}\n${url}`);
        setToast('Link copiado.');
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(`${payload.text}\n${url}`);
        setToast('Link copiado.');
      } catch {
        setToast('Não foi possível compartilhar esta publicação.');
      }
    }
  };

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-neon">Comunidade PlaySpace</p>
          <h1 className="mt-1 text-3xl font-black">Feed esportivo</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Publique novidades, converse com jogadores e acompanhe a comunidade em tempo real.</p>
        </div>
        <button className="neon-button inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 font-black" type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nova publicação
        </button>
      </header>

      <section className="mx-auto grid max-w-4xl gap-4" aria-label="Publicações mais recentes">
        {sortedPosts.slice(0, visible).map((post) => {
          const editable = user.role === 'ADMIN' || post.authorId === user.id;
          const liked = post.likedByCurrentUser || post.likedByUserIds?.includes(user.id);
          return (
            <article id={`post-${post.id}`} key={post.id} className="glass-panel scroll-mt-24 rounded-lg p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Avatar name={post.authorName} src={post.avatarUrl ?? state.users.find((item) => item.id === post.authorId)?.profile.photo} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-black">{post.authorName}</p>
                      <p className="text-xs text-muted"><time dateTime={post.createdAt}>{formatDateTime(post.createdAt)}</time>{post.updatedAt && post.updatedAt !== post.createdAt ? ' · editada' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-line bg-[var(--surface-2)] px-2.5 py-1 text-xs font-bold">{post.modality ?? post.type.replace(/_/g, ' ')}</span>
                      {editable && (
                        <div className="flex gap-1" aria-label="Ações da publicação">
                          <button className="ghost-button rounded-lg p-2" type="button" onClick={() => openEdit(post)} aria-label={`Editar publicação de ${post.authorName}`}><Edit3 className="h-4 w-4" /></button>
                          <button className="ghost-button rounded-lg p-2 text-[var(--danger)]" type="button" onClick={() => setDeletePostId(post.id)} aria-label={`Excluir publicação de ${post.authorName}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words leading-7">{post.content}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-3">
                <button className={`ghost-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-bold ${liked ? 'text-neon' : ''}`} type="button" aria-pressed={Boolean(liked)} onClick={async () => {
                  try { await likePost(post.id, user.id); }
                  catch (reason) { setToast(reason instanceof Error ? reason.message : 'Não foi possível atualizar a curtida.'); }
                }}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> <span className="hidden sm:inline">{liked ? 'Curtido' : 'Curtir'}</span> · {post.likes}</button>
                <button className="ghost-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-bold" type="button" onClick={() => void openComments(post.id)}><MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">Comentar</span> · {post.comments}</button>
                <button className="ghost-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-bold" type="button" onClick={() => void share(post)}><Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Compartilhar</span></button>
              </div>
            </article>
          );
        })}
        {sortedPosts.length === 0 && <EmptyState title="A comunidade está pronta" description="Crie a primeira publicação e inicie uma conversa esportiva." actionLabel="Nova publicação" onAction={openCreate} />}
        {visible < sortedPosts.length && <button className="ghost-button mx-auto min-h-11 rounded-lg px-5 py-2 font-black" type="button" onClick={() => setVisible((value) => value + 6)}>Carregar mais</button>}
      </section>

      <Modal title={draft.id ? 'Editar publicação' : 'Nova publicação'} open={postModal} onClose={() => setPostModal(false)} maxWidth="max-w-xl">
        <form className="grid gap-4" onSubmit={submitPost}>
          <label className="grid gap-2 text-sm font-bold">Conteúdo
            <textarea className="app-input min-h-36 resize-y" value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} maxLength={1200} placeholder="O que você quer compartilhar com a comunidade?" autoFocus required />
            <span className="text-right text-xs font-normal text-muted">{draft.content.length}/1.200</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Categoria
              <select className="app-input" value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}>
                <option value="COMUNIDADE">Comunidade</option><option value="RESERVA">Reserva</option><option value="PARCEIROS">Parceiros</option><option value="CAMPEONATO">Campeonato</option><option value="CONQUISTA">Conquista</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">Modalidade (opcional)
              <select className="app-input" value={draft.modality} onChange={(event) => setDraft((current) => ({ ...current, modality: event.target.value as Modality | '' }))}>
                <option value="">Todas</option>{modalities.map((modality) => <option key={modality}>{modality}</option>)}
              </select>
            </label>
          </div>
          {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button className="ghost-button min-h-11 rounded-lg px-4 py-2 font-bold" type="button" onClick={() => setPostModal(false)}>Cancelar</button>
            <button className="neon-button min-h-11 rounded-lg px-4 py-2 font-black disabled:opacity-60" type="submit" disabled={submitting || !draft.content.trim()}>{submitting ? 'Salvando...' : 'Salvar publicação'}</button>
          </div>
        </form>
      </Modal>

      <Modal title="Comentários" open={Boolean(commentsPostId)} onClose={() => { setCommentsPostId(''); setError(''); }} maxWidth="max-w-2xl">
        <div className="grid gap-4">
          {commentsPost && <div className="rounded-lg border border-line bg-[var(--surface-2)] p-4"><p className="text-sm font-bold">{commentsPost.authorName}</p><p className="mt-1 text-sm text-muted">{commentsPost.content}</p></div>}
          <div className="grid max-h-[45dvh] gap-3 overflow-y-auto pr-1">
            {(commentsPost?.commentItems ?? []).map((comment) => {
              const editable = user.role === 'ADMIN' || comment.authorId === user.id || comment.editable;
              return <article key={comment.id} className="soft-panel rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <Avatar name={comment.authorName} src={comment.avatarUrl} size={36} />
                  <div className="min-w-0 flex-1"><p className="font-bold">{comment.authorName}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{comment.content}</p><time className="mt-2 block text-xs text-muted" dateTime={comment.createdAt}>{formatDateTime(comment.createdAt)}</time></div>
                  {editable && <div className="flex gap-1"><button className="ghost-button rounded-lg p-2" type="button" onClick={() => { setEditingCommentId(comment.id); setCommentText(comment.content); }} aria-label="Editar comentário"><Edit3 className="h-4 w-4" /></button><button className="ghost-button rounded-lg p-2 text-[var(--danger)]" type="button" onClick={() => setDeleteCommentId(comment.id)} aria-label="Excluir comentário"><Trash2 className="h-4 w-4" /></button></div>}
                </div>
              </article>;
            })}
            {(commentsPost?.commentItems ?? []).length === 0 && <p className="py-8 text-center text-sm text-muted">Ainda não há comentários. Seja a primeira pessoa a conversar.</p>}
          </div>
          <form className="grid gap-3 border-t border-line pt-4" onSubmit={submitComment}>
            <label className="sr-only" htmlFor="community-comment">Comentário</label>
            <textarea id="community-comment" className="app-input min-h-24 resize-y" value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={800} placeholder="Escreva um comentário..." />
            {error && <p className="text-sm text-[var(--danger)]" role="alert">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted">{commentText.length}/800</span><div className="flex gap-2">{editingCommentId && <button className="ghost-button min-h-11 rounded-lg px-3 py-2 text-sm font-bold" type="button" onClick={() => { setEditingCommentId(''); setCommentText(''); }}>Cancelar edição</button>}<button className="neon-button inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-black disabled:opacity-60" type="submit" disabled={submitting || !commentText.trim()}><Send className="h-4 w-4" />{submitting ? 'Enviando...' : editingCommentId ? 'Atualizar' : 'Comentar'}</button></div></div>
          </form>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deletePostId)} title="Excluir publicação?" description="A publicação, suas curtidas e comentários serão removidos. Esta ação não pode ser desfeita." confirmLabel="Excluir publicação" onClose={() => setDeletePostId('')} onConfirm={async () => { await removeCommunityPost(deletePostId, user); setDeletePostId(''); setToast('Publicação excluída.'); }} />
      <ConfirmDialog open={Boolean(deleteCommentId)} title="Excluir comentário?" description={`O comentário de ${commentToDelete?.authorName ?? 'jogador'} será removido permanentemente.`} confirmLabel="Excluir comentário" onClose={() => setDeleteCommentId('')} onConfirm={async () => { await removeCommunityComment(commentsPostId, deleteCommentId, user); setDeleteCommentId(''); setToast('Comentário excluído.'); }} />
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}
