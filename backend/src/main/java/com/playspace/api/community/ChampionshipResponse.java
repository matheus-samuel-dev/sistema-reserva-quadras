package com.playspace.api.community;

import com.playspace.api.court.Modality;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;

public record ChampionshipResponse(
        Long id,
        String name,
        Modality modality,
        LocalDate startDate,
        String categories,
        String prize,
        String status,
        String regulation,
        List<String> bracket,
        OffsetDateTime createdAt
) {
    static ChampionshipResponse from(Championship championship) {
        return new ChampionshipResponse(
                championship.getId(),
                championship.getName(),
                championship.getModality(),
                championship.getStartDate(),
                championship.getCategories(),
                championship.getPrize(),
                championship.getStatus(),
                championship.getRegulation(),
                parseBracket(championship.getBracketDemo()),
                championship.getCreatedAt()
        );
    }

    private static List<String> parseBracket(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split("\\s*(?:->|\\||;|\\R)\\s*"))
                .map(String::trim)
                .filter(step -> !step.isBlank())
                .toList();
    }
}
