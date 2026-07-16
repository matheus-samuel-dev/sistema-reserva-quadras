package com.playspace.api.user;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PublicRegistrationRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 72) String password,
        @NotBlank @Size(max = 72) String passwordConfirmation,
        @Size(max = 30) String phone,
        @AssertTrue(message = "E necessario aceitar os termos de uso.") boolean acceptedTerms
) {
}
