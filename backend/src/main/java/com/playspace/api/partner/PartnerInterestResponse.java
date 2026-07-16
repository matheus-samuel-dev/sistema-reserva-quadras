package com.playspace.api.partner;

import java.time.OffsetDateTime;

public record PartnerInterestResponse(
        Long id,
        Long senderId,
        String senderName,
        String senderAvatarUrl,
        Long receiverId,
        String receiverName,
        String receiverAvatarUrl,
        PartnerInterestStatus status,
        String message,
        String contactEmail,
        OffsetDateTime createdAt,
        OffsetDateTime respondedAt,
        OffsetDateTime cancelledAt
) {}
