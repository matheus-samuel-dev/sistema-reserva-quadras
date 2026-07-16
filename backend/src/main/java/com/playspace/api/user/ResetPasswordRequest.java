package com.playspace.api.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Size(max = 72) String temporaryPassword,
        @NotBlank @Size(max = 72) String temporaryPasswordConfirmation
) {
}
