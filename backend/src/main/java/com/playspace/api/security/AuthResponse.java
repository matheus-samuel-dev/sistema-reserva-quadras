package com.playspace.api.security;

import com.playspace.api.user.UserResponse;

public record AuthResponse(String token, UserResponse user) {
}
