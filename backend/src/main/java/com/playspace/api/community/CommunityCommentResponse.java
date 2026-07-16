package com.playspace.api.community;

import java.time.OffsetDateTime;

public record CommunityCommentResponse(
        Long id,
        Long postId,
        Long authorId,
        String authorName,
        String avatarUrl,
        String content,
        boolean editable,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    static CommunityCommentResponse from(CommunityComment comment, boolean editable) {
        return new CommunityCommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getName(),
                comment.getAuthor().getAvatarUrl(),
                comment.getContent(),
                editable,
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
