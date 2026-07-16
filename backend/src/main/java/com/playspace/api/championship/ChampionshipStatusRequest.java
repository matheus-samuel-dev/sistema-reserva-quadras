package com.playspace.api.championship;

import jakarta.validation.constraints.NotNull;

public record ChampionshipStatusRequest(@NotNull ChampionshipStatus status) {}
