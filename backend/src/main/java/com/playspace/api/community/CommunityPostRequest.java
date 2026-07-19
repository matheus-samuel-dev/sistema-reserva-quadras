package com.playspace.api.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommunityPostRequest(
        @NotBlank(message = "Informe o conteúdo da publicação.")
        @Size(max = 1200, message = "O conteúdo deve ter no máximo 1200 caracteres.")
        String content,
        @Size(max = 255, message = "O tipo deve ter no máximo 255 caracteres.")
        String type,
        @Size(max = 40, message = "A modalidade deve ter no máximo 40 caracteres.")
        String modality
) {
}
