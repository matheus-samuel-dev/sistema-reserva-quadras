package com.playspace.api.community;

import java.time.OffsetDateTime;

public record CommunityPostResponse(
        Long id,
        Long authorId,
        String authorName,
        String avatarUrl,
        String content,
        String type,
        String modality,
        int likes,
        int comments,
        boolean likedByCurrentUser,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    static CommunityPostResponse from(CommunityPost post, boolean likedByCurrentUser) {
        return new CommunityPostResponse(
                post.getId(),
                post.getAuthor().getId(),
                post.getAuthor().getName(),
                post.getAuthor().getAvatarUrl(),
                post.getContent(),
                post.getType(),
                post.getModality(),
                post.getLikes(),
                post.getComments(),
                likedByCurrentUser,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    static CommunityPostResponse from(CommunityPost post) {
        return from(post, false);
    }
}
