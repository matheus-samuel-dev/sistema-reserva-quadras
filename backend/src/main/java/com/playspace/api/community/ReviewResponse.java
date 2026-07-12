package com.playspace.api.community;

import java.time.OffsetDateTime;

public record ReviewResponse(
        Long id,
        String userName,
        String avatarUrl,
        String courtName,
        Ratings ratings,
        double average,
        String comment,
        OffsetDateTime createdAt
) {
    static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getName(),
                review.getUser().getAvatarUrl(),
                review.getCourt().getName(),
                new Ratings(
                        review.getCleaning(),
                        review.getLighting(),
                        review.getOrganization(),
                        review.getService(),
                        review.getCourtQuality()
                ),
                review.getAverage(),
                review.getComment(),
                review.getCreatedAt()
        );
    }

    public record Ratings(
            int cleaning,
            int lighting,
            int organization,
            int service,
            int courtQuality
    ) {
    }
}
