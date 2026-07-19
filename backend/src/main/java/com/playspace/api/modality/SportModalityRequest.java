package com.playspace.api.modality;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record SportModalityRequest(
        @Size(min = 2, max = 40) String code,
        @NotBlank @Size(min = 2, max = 80) String name,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal defaultPrice
) {
}
