package com.playspace.api.security;

import com.playspace.api.user.AppUser;

public record AuthResponse(String token, AppUser user) {
}
