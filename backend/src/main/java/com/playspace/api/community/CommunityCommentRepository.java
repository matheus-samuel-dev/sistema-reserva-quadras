package com.playspace.api.community;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {
    @EntityGraph(attributePaths = "author")
    Page<CommunityComment> findByPostIdOrderByCreatedAtAsc(Long postId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "post", "post.author"})
    @Query("select comment from CommunityComment comment where comment.id = :id")
    Optional<CommunityComment> findDetailedById(@Param("id") Long id);

    long countByPostId(Long postId);

    boolean existsByPostIdAndAuthorIdAndContent(Long postId, Long authorId, String content);
}
