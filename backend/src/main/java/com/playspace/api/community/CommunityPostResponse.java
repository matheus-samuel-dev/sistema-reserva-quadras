package com.playspace.api.community;

import java.time.OffsetDateTime;

public record CommunityPostResponse(
        Long id,
        Long authorId,
        String authorName,
        String avatarUrl,
        String content,
        String type,
        int likes,
        int comments,
        OffsetDateTime createdAt
) {
    static CommunityPostResponse from(CommunityPost post) {
        return new CommunityPostResponse(
                post.getId(),
                post.getAuthor().getId(),
                post.getAuthor().getName(),
                post.getAuthor().getAvatarUrl(),
                post.getContent(),
                post.getType(),
                post.getLikes(),
                post.getComments(),
                post.getCreatedAt()
        );
    }
}
