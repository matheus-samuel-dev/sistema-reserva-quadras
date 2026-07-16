package com.playspace.api.community;

import java.util.Optional;
import java.util.Collection;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityPostLikeRepository extends JpaRepository<CommunityPostLike, Long> {
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    Optional<CommunityPostLike> findByPostIdAndUserId(Long postId, Long userId);
    long countByPostId(Long postId);

    @Query("select postLike.post.id from CommunityPostLike postLike where postLike.user.id = :userId and postLike.post.id in :postIds")
    Set<Long> findLikedPostIds(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);
}
