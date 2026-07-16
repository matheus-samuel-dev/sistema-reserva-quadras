package com.playspace.api.partner;

import jakarta.validation.constraints.Size;

public record PartnerInterestRequest(@Size(max = 500) String message) {}
