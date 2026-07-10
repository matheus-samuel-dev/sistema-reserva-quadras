package com.playspace.api.user;

import com.playspace.api.court.Modality;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserRequest(
        @NotBlank String name,
        @Email String email,
        String password,
        @NotNull Role role,
        boolean active,
        String city,
        String bio,
        Modality favoriteModality,
        String sportsLevel
) {
}
