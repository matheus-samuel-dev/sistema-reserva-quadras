package com.playspace.api.community;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.modality.SportModalityService;
import com.playspace.api.notification.NotificationService;
import com.playspace.api.security.CurrentUserService;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.Role;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityPostService {
    private static final String CATEGORY = "COMUNIDADE";

    private final CommunityPostRepository posts;
    private final CommunityPostLikeRepository likes;
    private final CommunityCommentRepository comments;
    private final CurrentUserService currentUser;
    private final NotificationService notifications;
    private final AuditService audit;
    private final SportModalityService modalities;

    public CommunityPostService(
            CommunityPostRepository posts,
            CommunityPostLikeRepository likes,
            CommunityCommentRepository comments,
            CurrentUserService currentUser,
            NotificationService notifications,
            AuditService audit,
            SportModalityService modalities
    ) {
        this.posts = posts;
        this.likes = likes;
        this.comments = comments;
        this.currentUser = currentUser;
        this.notifications = notifications;
        this.audit = audit;
        this.modalities = modalities;
    }

    @Transactional(readOnly = true)
    public List<CommunityPostResponse> legacyFeed() {
        var actor = currentUser.user();
        var result = posts.findTop20ByOrderByCreatedAtDesc();
        var likedPostIds = likedPostIds(result, actor);
        return result.stream()
                .map(post -> CommunityPostResponse.from(post, likedPostIds.contains(post.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<CommunityPostResponse> list(int page, int size) {
        var actor = currentUser.user();
        var pageable = PageRequest.of(page, size, Sort.unsorted());
        var result = posts.findAllByOrderByCreatedAtDesc(pageable);
        var likedPostIds = likedPostIds(result.getContent(), actor);
        return PageResponse.from(result.map(post -> CommunityPostResponse.from(post, likedPostIds.contains(post.getId()))));
    }

    @Transactional(readOnly = true)
    public CommunityPostResponse detail(Long postId) {
        var actor = currentUser.user();
        return response(findPost(postId), actor);
    }

    @Transactional
    public CommunityPostResponse create(CommunityPostRequest request) {
        var actor = currentUser.user();
        var post = new CommunityPost();
        post.setAuthor(actor);
        apply(post, request);
        post.setLikes(0);
        post.setComments(0);
        post = posts.save(post);
        audit.record(actor, "Nova publicação criada na Comunidade.", CATEGORY);
        return response(post, actor);
    }

    @Transactional
    public CommunityPostResponse update(Long postId, CommunityPostRequest request) {
        var actor = currentUser.user();
        var post = findPost(postId);
        requireOwnerOrAdmin(post.getAuthor(), actor);
        apply(post, request);
        post = posts.save(post);
        audit.record(actor, "Publicação da Comunidade atualizada.", CATEGORY);
        return response(post, actor);
    }

    @Transactional
    public void delete(Long postId) {
        var actor = currentUser.user();
        var post = posts.findLockedById(postId)
                .orElseThrow(() -> new NotFoundException("Publicação não encontrada."));
        requireOwnerOrAdmin(post.getAuthor(), actor);
        posts.delete(post);
        audit.record(actor, "Publicação removida da Comunidade.", CATEGORY);
    }

    @Transactional
    public CommunityPostResponse like(Long postId) {
        var actor = currentUser.user();
        var post = posts.findLockedById(postId)
                .orElseThrow(() -> new NotFoundException("Publicação não encontrada."));
        if (!likes.existsByPostIdAndUserId(postId, actor.getId())) {
            var like = new CommunityPostLike();
            like.setPost(post);
            like.setUser(actor);
            likes.saveAndFlush(like);
            if (!post.getAuthor().getId().equals(actor.getId())) {
                notifications.create(
                        post.getAuthor(),
                        "Nova curtida",
                        actor.getName() + " curtiu sua publicação na Comunidade.",
                        "COMUNIDADE"
                );
            }
            audit.record(actor, "Publicação curtida na Comunidade.", CATEGORY);
        }
        synchronizeLikes(post);
        return response(post, actor);
    }

    @Transactional
    public CommunityPostResponse unlike(Long postId) {
        var actor = currentUser.user();
        var post = posts.findLockedById(postId)
                .orElseThrow(() -> new NotFoundException("Publicação não encontrada."));
        likes.findByPostIdAndUserId(postId, actor.getId()).ifPresent(like -> {
            likes.delete(like);
            likes.flush();
            audit.record(actor, "Curtida removida de uma publicação.", CATEGORY);
        });
        synchronizeLikes(post);
        return response(post, actor);
    }

    @Transactional(readOnly = true)
    public PageResponse<CommunityCommentResponse> listComments(Long postId, int page, int size) {
        findPost(postId);
        var actor = currentUser.user();
        var pageable = PageRequest.of(page, size);
        return PageResponse.from(comments.findByPostIdOrderByCreatedAtAsc(postId, pageable)
                .map(comment -> commentResponse(comment, actor)));
    }

    @Transactional
    public CommunityCommentResponse createComment(Long postId, CommunityCommentRequest request) {
        var actor = currentUser.user();
        var post = posts.findLockedById(postId)
                .orElseThrow(() -> new NotFoundException("Publicação não encontrada."));
        var comment = new CommunityComment();
        comment.setPost(post);
        comment.setAuthor(actor);
        comment.setContent(normalize(request.content()));
        comment = comments.saveAndFlush(comment);
        synchronizeComments(post);
        if (!post.getAuthor().getId().equals(actor.getId())) {
            notifications.create(
                    post.getAuthor(),
                    "Novo comentário",
                    actor.getName() + " comentou na sua publicação.",
                    "COMUNIDADE"
            );
        }
        audit.record(actor, "Comentário publicado na Comunidade.", CATEGORY);
        return commentResponse(comment, actor);
    }

    @Transactional
    public CommunityCommentResponse updateComment(Long commentId, CommunityCommentRequest request) {
        var actor = currentUser.user();
        var comment = findComment(commentId);
        requireOwnerOrAdmin(comment.getAuthor(), actor);
        comment.setContent(normalize(request.content()));
        comment = comments.save(comment);
        audit.record(actor, "Comentário da Comunidade atualizado.", CATEGORY);
        return commentResponse(comment, actor);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        var actor = currentUser.user();
        var comment = findComment(commentId);
        requireOwnerOrAdmin(comment.getAuthor(), actor);
        var post = posts.findLockedById(comment.getPost().getId())
                .orElseThrow(() -> new NotFoundException("Publicação não encontrada."));
        comments.delete(comment);
        comments.flush();
        synchronizeComments(post);
        audit.record(actor, "Comentário removido da Comunidade.", CATEGORY);
    }

    private CommunityPost findPost(Long postId) {
        return posts.findDetailedById(postId)
                .orElseThrow(() -> new NotFoundException("Publicação não encontrada."));
    }

    private CommunityComment findComment(Long commentId) {
        return comments.findDetailedById(commentId)
                .orElseThrow(() -> new NotFoundException("Comentário não encontrado."));
    }

    private void apply(CommunityPost post, CommunityPostRequest request) {
        post.setContent(normalize(request.content()));
        var type = request.type() == null || request.type().isBlank() ? "COMUNIDADE" : request.type().strip();
        post.setType(type.toUpperCase(Locale.ROOT));
        post.setModality(request.modality() == null || request.modality().isBlank() ? null
                : modalities.requireActive(request.modality()).getCode());
    }

    private String normalize(String value) {
        return value.strip().replaceAll("\\s+", " ");
    }

    private void requireOwnerOrAdmin(AppUser owner, AppUser actor) {
        if (actor.getRole() != Role.ADMIN && !owner.getId().equals(actor.getId())) {
            throw new AccessDeniedException("Apenas o autor ou um administrador pode realizar esta ação.");
        }
    }

    private CommunityPostResponse response(CommunityPost post, AppUser actor) {
        return CommunityPostResponse.from(post, likes.existsByPostIdAndUserId(post.getId(), actor.getId()));
    }

    private java.util.Set<Long> likedPostIds(List<CommunityPost> result, AppUser actor) {
        if (result.isEmpty()) {
            return java.util.Set.of();
        }
        return likes.findLikedPostIds(actor.getId(), result.stream().map(CommunityPost::getId).toList());
    }

    private CommunityCommentResponse commentResponse(CommunityComment comment, AppUser actor) {
        var editable = actor.getRole() == Role.ADMIN || comment.getAuthor().getId().equals(actor.getId());
        return CommunityCommentResponse.from(comment, editable);
    }

    private void synchronizeLikes(CommunityPost post) {
        post.setLikes(Math.toIntExact(likes.countByPostId(post.getId())));
        posts.save(post);
    }

    private void synchronizeComments(CommunityPost post) {
        post.setComments(Math.toIntExact(comments.countByPostId(post.getId())));
        posts.save(post);
    }
}
