package com.playspace.api.court;

import com.playspace.api.common.NotFoundException;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courts")
public class CourtController {
    private final CourtRepository courts;

    public CourtController(CourtRepository courts) {
        this.courts = courts;
    }

    @GetMapping
    List<Court> list() {
        return courts.findAll();
    }

    @GetMapping("/{id}")
    Court get(@PathVariable Long id) {
        return courts.findById(id).orElseThrow(() -> new NotFoundException("Quadra nao encontrada."));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    Court create(@Valid @RequestBody Court court) {
        court.setId(null);
        return courts.save(court);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    Court update(@PathVariable Long id, @Valid @RequestBody Court payload) {
        var court = courts.findById(id).orElseThrow(() -> new NotFoundException("Quadra nao encontrada."));
        court.setName(payload.getName());
        court.setModality(payload.getModality());
        court.setDescription(payload.getDescription());
        court.setPricePerHour(payload.getPricePerHour());
        court.setPlayerCapacity(payload.getPlayerCapacity());
        court.setStatus(payload.getStatus());
        court.setImageUrl(payload.getImageUrl());
        court.setLocation(payload.getLocation());
        court.setLighting(payload.isLighting());
        court.setCovered(payload.isCovered());
        court.setRating(payload.getRating());
        return courts.save(court);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    void delete(@PathVariable Long id) {
        courts.deleteById(id);
    }
}
