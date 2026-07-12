package com.playspace.api.court;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.security.CurrentUserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courts")
public class CourtController {
    private final CourtRepository courts;
    private final CurrentUserService currentUser;
    private final AuditService audit;

    public CourtController(CourtRepository courts, CurrentUserService currentUser, AuditService audit) {
        this.courts = courts;
        this.currentUser = currentUser;
        this.audit = audit;
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
    @Transactional
    public Court create(@Valid @RequestBody Court court) {
        court.setId(null);
        var saved = courts.save(court);
        audit.record(currentUser.user(), "Criou a quadra " + saved.getName(), "QUADRA");
        return saved;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Court update(@PathVariable Long id, @Valid @RequestBody Court payload) {
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
        var saved = courts.save(court);
        audit.record(currentUser.user(), "Atualizou a quadra " + saved.getName(), "QUADRA");
        return saved;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        var court = courts.findById(id).orElseThrow(() -> new NotFoundException("Quadra nao encontrada."));
        court.setStatus(CourtStatus.INDISPONIVEL);
        courts.save(court);
        audit.record(currentUser.user(), "Inativou a quadra " + court.getName(), "QUADRA");
    }
}
