package com.playspace.api.community;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    @EntityGraph(attributePaths = "author")
    List<CommunityPost> findTop20ByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "author")
    Page<CommunityPost> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query("select post from CommunityPost post where post.id = :id")
    Optional<CommunityPost> findDetailedById(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select post from CommunityPost post join fetch post.author where post.id = :id")
    Optional<CommunityPost> findLockedById(@Param("id") Long id);

    boolean existsByAuthorIdAndContent(Long authorId, String content);
}
