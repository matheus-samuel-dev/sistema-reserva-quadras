package com.playspace.api.community;

import com.playspace.api.court.Modality;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.UserRepository;
import java.util.List;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile({"demo", "test"})
public class CommunityDemoSeeder {
    private final UserRepository users;
    private final CommunityPostRepository posts;
    private final CommunityCommentRepository comments;
    private final CommunityPostLikeRepository likes;

    public CommunityDemoSeeder(
            UserRepository users,
            CommunityPostRepository posts,
            CommunityCommentRepository comments,
            CommunityPostLikeRepository likes
    ) {
        this.users = users;
        this.posts = posts;
        this.comments = comments;
        this.likes = likes;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        var admin = users.findByEmail("admin@playspace.com").orElse(null);
        var marina = users.findByEmail("cliente@playspace.com").orElse(null);
        var lucas = users.findByEmail("lucas@playspace.com").orElse(null);
        if (admin == null || marina == null || lucas == null) {
            return;
        }

        posts.findTop20ByOrderByCreatedAtDesc().forEach(this::normalizeLegacyDemoText);
        posts.flush();

        ensurePost(
                admin,
                "Inscrições abertas para o Open PlaySpace de Beach Tennis.",
                "CAMPEONATO",
                Modality.BEACH_TENNIS
        );
        ensurePost(
                marina,
                "Nova reserva criada na Quadra Aurora.",
                "RESERVA",
                Modality.BEACH_TENNIS
        );
        ensurePost(
                lucas,
                "Procuro um time para partidas de Society às quintas-feiras.",
                "PARCEIROS",
                Modality.SOCIETY
        );

        var allUsers = List.of(admin, marina, lucas);
        for (var post : posts.findTop20ByOrderByCreatedAtDesc()) {
            for (var user : allUsers) {
                if (!user.getId().equals(post.getAuthor().getId()) && !likes.existsByPostIdAndUserId(post.getId(), user.getId())) {
                    var like = new CommunityPostLike();
                    like.setPost(post);
                    like.setUser(user);
                    likes.save(like);
                }
            }
            var commentAuthor = post.getAuthor().getId().equals(marina.getId()) ? lucas : marina;
            var commentText = "Ótima notícia! Obrigado por compartilhar com a comunidade.";
            if (!comments.existsByPostIdAndAuthorIdAndContent(post.getId(), commentAuthor.getId(), commentText)) {
                var comment = new CommunityComment();
                comment.setPost(post);
                comment.setAuthor(commentAuthor);
                comment.setContent(commentText);
                comments.save(comment);
            }
            posts.flush();
            post.setLikes(Math.toIntExact(likes.countByPostId(post.getId())));
            post.setComments(Math.toIntExact(comments.countByPostId(post.getId())));
            posts.save(post);
        }
    }

    private void ensurePost(AppUser author, String content, String type, Modality modality) {
        if (posts.existsByAuthorIdAndContent(author.getId(), content)) {
            return;
        }
        var post = new CommunityPost();
        post.setAuthor(author);
        post.setContent(content);
        post.setType(type);
        post.setModality(modality);
        post.setLikes(0);
        post.setComments(0);
        posts.save(post);
    }

    private void normalizeLegacyDemoText(CommunityPost post) {
        var replacement = switch (post.getContent()) {
            case "realizou uma nova reserva na Quadra Aurora." -> "Nova reserva criada na Quadra Aurora.";
            case "concluiu a 50a partida no PlaySpace." -> "50ª partida concluída no PlaySpace.";
            case "publicou que procura dupla para Futevolei." -> "Procura-se dupla para Futevôlei.";
            case "desbloqueou a conquista Cliente VIP." -> "Conquista Cliente VIP desbloqueada.";
            case "comentou no campeonato Open PlaySpace." -> "Comentário publicado no campeonato Open PlaySpace.";
            default -> post.getContent();
        };
        post.setContent(replacement);
    }
}
