package com.playspace.api.user;

import com.playspace.api.court.Modality;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 72) String password,
        @NotNull Role role,
        boolean active,
        @Size(max = 120) String city,
        @Size(max = 255) String bio,
        Modality favoriteModality,
        @Size(max = 40) String sportsLevel,
        @Size(max = 255) String avatarUrl
) {
}
