package com.playspace.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.playspace.api.common.ActivityLogRepository;
import com.playspace.api.community.CommunityCommentRepository;
import com.playspace.api.community.CommunityPostLikeRepository;
import com.playspace.api.community.CommunityPostRepository;
import com.playspace.api.notification.NotificationRepository;
import com.playspace.api.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CommunityInteractionsIntegrationTest {
    private static final String CLIENT = "cliente@playspace.com";
    private static final String OTHER_CLIENT = "lucas@playspace.com";
    private static final String ADMIN = "admin@playspace.com";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired CommunityPostRepository posts;
    @Autowired CommunityPostLikeRepository likes;
    @Autowired CommunityCommentRepository comments;
    @Autowired NotificationRepository notifications;
    @Autowired ActivityLogRepository activities;
    @Autowired UserRepository users;

    @Test
    void postCrudIsPagedPersistentAndProtectedByOwnership() throws Exception {
        var postId = createPost("Treino confirmado para sábado pela manhã.");

        mvc.perform(get("/api/community/posts")
                        .param("page", "0")
                        .param("size", "5")
                        .with(user(CLIENT).roles("CLIENTE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").isNumber());

        mvc.perform(get("/api/community/posts/{id}", postId).with(user(CLIENT).roles("CLIENTE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Treino confirmado para sábado pela manhã."))
                .andExpect(jsonPath("$.authorName").value("Marina Costa"))
                .andExpect(jsonPath("$.author").doesNotExist())
                .andExpect(jsonPath("$.updatedAt").exists());

        var updateBody = """
                {"content":"Treino atualizado para domingo às 09:00.","type":"agenda","modality":"BEACH_TENNIS"}
                """;
        mvc.perform(put("/api/community/posts/{id}", postId)
                        .with(user(OTHER_CLIENT).roles("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/community/posts/{id}", postId)
                        .with(user(CLIENT).roles("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Treino atualizado para domingo às 09:00."))
                .andExpect(jsonPath("$.type").value("AGENDA"));

        assertThat(posts.findById(postId)).get().extracting(post -> post.getContent())
                .isEqualTo("Treino atualizado para domingo às 09:00.");

        mvc.perform(delete("/api/community/posts/{id}", postId)
                        .with(user(OTHER_CLIENT).roles("CLIENTE")))
                .andExpect(status().isForbidden());

        mvc.perform(delete("/api/community/posts/{id}", postId)
                        .with(user(ADMIN).roles("ADMIN")))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/community/posts/{id}", postId).with(user(CLIENT).roles("CLIENTE")))
                .andExpect(status().isNotFound());
    }

    @Test
    void likesAndUnlikesAreIdempotentAndNotifyTheAuthorOnce() throws Exception {
        var postId = createPost("Publicação para testar curtidas persistentes.");
        var author = users.findByEmail(CLIENT).orElseThrow();
        var notificationsBefore = notifications.findByUserIdOrderByCreatedAtDesc(author.getId()).size();

        for (int request = 0; request < 2; request++) {
            mvc.perform(post("/api/community/posts/{id}/likes", postId)
                            .with(user(OTHER_CLIENT).roles("CLIENTE")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.likes").value(1))
                    .andExpect(jsonPath("$.likedByCurrentUser").value(true));
        }

        assertThat(likes.countByPostId(postId)).isEqualTo(1);
        assertThat(notifications.findByUserIdOrderByCreatedAtDesc(author.getId()))
                .hasSize(notificationsBefore + 1)
                .first()
                .satisfies(notification -> {
                    assertThat(notification.getTitle()).isEqualTo("Nova curtida");
                    assertThat(notification.getMessage()).startsWith("Lucas Alves curtiu");
                });

        for (int request = 0; request < 2; request++) {
            mvc.perform(delete("/api/community/posts/{id}/likes", postId)
                            .with(user(OTHER_CLIENT).roles("CLIENTE")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.likes").value(0))
                    .andExpect(jsonPath("$.likedByCurrentUser").value(false));
        }

        assertThat(likes.countByPostId(postId)).isZero();
        assertThat(posts.findById(postId).orElseThrow().getLikes()).isZero();
    }

    @Test
    void commentsSupportValidationPaginationEditingModerationAndCounters() throws Exception {
        var postId = createPost("Publicação para testar comentários persistentes.");
        var author = users.findByEmail(CLIENT).orElseThrow();
        var notificationsBefore = notifications.findByUserIdOrderByCreatedAtDesc(author.getId()).size();

        mvc.perform(post("/api/community/posts/{id}/comments", postId)
                        .with(user(OTHER_CLIENT).roles("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validação"));

        var result = mvc.perform(post("/api/community/posts/{id}/comments", postId)
                        .with(user(OTHER_CLIENT).roles("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"  Excelente iniciativa!  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Excelente iniciativa!"))
                .andExpect(jsonPath("$.authorName").value("Lucas Alves"))
                .andExpect(jsonPath("$.editable").value(true))
                .andReturn();
        var commentId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        mvc.perform(get("/api/community/posts/{id}/comments", postId)
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(CLIENT).roles("CLIENTE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(commentId))
                .andExpect(jsonPath("$.content[0].editable").value(false))
                .andExpect(jsonPath("$.totalElements").value(1));

        assertThat(comments.countByPostId(postId)).isEqualTo(1);
        assertThat(posts.findById(postId).orElseThrow().getComments()).isEqualTo(1);
        assertThat(notifications.findByUserIdOrderByCreatedAtDesc(author.getId())).hasSize(notificationsBefore + 1);

        var editBody = "{\"content\":\"Comentário revisado e persistido.\"}";
        mvc.perform(put("/api/community/comments/{id}", commentId)
                        .with(user(CLIENT).roles("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(editBody))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/community/comments/{id}", commentId)
                        .with(user(OTHER_CLIENT).roles("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(editBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Comentário revisado e persistido."));
        assertThat(comments.findById(commentId).orElseThrow().getContent())
                .isEqualTo("Comentário revisado e persistido.");

        mvc.perform(delete("/api/community/comments/{id}", commentId)
                        .with(user(ADMIN).roles("ADMIN")))
                .andExpect(status().isNoContent());

        assertThat(comments.findById(commentId)).isEmpty();
        assertThat(posts.findById(postId).orElseThrow().getComments()).isZero();
        assertThat(activities.findTop12ByOrderByCreatedAtDesc())
                .anySatisfy(activity -> assertThat(activity.getAction()).startsWith("Comentário"));
    }

    @Test
    void legacyFeedAndLikeContractRemainCompatibleWithoutEntityLeakage() throws Exception {
        var postId = createPost("Compatibilidade do feed legado.");

        mvc.perform(get("/api/community/feed").with(user(CLIENT).roles("CLIENTE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].authorId").exists())
                .andExpect(jsonPath("$[0].author").doesNotExist());

        mvc.perform(post("/api/community/feed/{id}/like", postId)
                        .with(user(OTHER_CLIENT).roles("CLIENTE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likes").value(1));
    }

    private long createPost(String content) throws Exception {
        var result = mvc.perform(post("/api/community/posts")
                        .with(user(CLIENT).roles("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"%s","type":"comunidade","modality":"BEACH_TENNIS"}
                                """.formatted(content)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
}
