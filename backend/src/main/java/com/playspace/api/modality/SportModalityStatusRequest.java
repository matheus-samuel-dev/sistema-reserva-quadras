package com.playspace.api.modality;

import jakarta.validation.constraints.NotNull;

public record SportModalityStatusRequest(@NotNull Boolean active) {
}
