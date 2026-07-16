package com.playspace.api.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommunityCommentRequest(
        @NotBlank(message = "Escreva um comentário antes de enviar.")
        @Size(max = 800, message = "O comentário deve ter no máximo 800 caracteres.")
        String content
) {
}
