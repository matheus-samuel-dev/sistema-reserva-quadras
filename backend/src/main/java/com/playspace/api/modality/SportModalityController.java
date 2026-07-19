package com.playspace.api.modality;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/modalities")
public class SportModalityController {
    private final SportModalityService service;

    public SportModalityController(SportModalityService service) {
        this.service = service;
    }

    @GetMapping
    public List<SportModalityResponse> list(
            @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive
    ) {
        return service.list(includeInactive);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public SportModalityResponse create(@Valid @RequestBody SportModalityRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{code}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public SportModalityResponse updateStatus(
            @PathVariable String code,
            @Valid @RequestBody SportModalityStatusRequest request
    ) {
        return service.updateStatus(code, request.active());
    }
}
