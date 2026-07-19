package com.playspace.api.championship;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.common.ConflictException;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.modality.SportModalityService;
import com.playspace.api.notification.NotificationService;
import com.playspace.api.security.CurrentUserService;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.Role;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChampionshipService {
    private static final Map<ChampionshipStatus, Set<ChampionshipStatus>> TRANSITIONS = Map.of(
            ChampionshipStatus.RASCUNHO, EnumSet.of(ChampionshipStatus.INSCRICOES_ABERTAS, ChampionshipStatus.CANCELADO),
            ChampionshipStatus.INSCRICOES_ABERTAS, EnumSet.of(ChampionshipStatus.INSCRICOES_ENCERRADAS, ChampionshipStatus.CANCELADO),
            ChampionshipStatus.INSCRICOES_ENCERRADAS, EnumSet.of(ChampionshipStatus.INSCRICOES_ABERTAS, ChampionshipStatus.EM_ANDAMENTO, ChampionshipStatus.CANCELADO),
            ChampionshipStatus.EM_ANDAMENTO, EnumSet.of(ChampionshipStatus.CONCLUIDO, ChampionshipStatus.CANCELADO),
            ChampionshipStatus.CONCLUIDO, EnumSet.noneOf(ChampionshipStatus.class),
            ChampionshipStatus.CANCELADO, EnumSet.noneOf(ChampionshipStatus.class)
    );

    private final ChampionshipRepository championships;
    private final ChampionshipEnrollmentRepository enrollments;
    private final CourtRepository courts;
    private final CurrentUserService currentUser;
    private final NotificationService notifications;
    private final AuditService audit;
    private final SportModalityService modalities;

    public ChampionshipService(
            ChampionshipRepository championships,
            ChampionshipEnrollmentRepository enrollments,
            CourtRepository courts,
            CurrentUserService currentUser,
            NotificationService notifications,
            AuditService audit,
            SportModalityService modalities
    ) {
        this.championships = championships;
        this.enrollments = enrollments;
        this.courts = courts;
        this.currentUser = currentUser;
        this.notifications = notifications;
        this.audit = audit;
        this.modalities = modalities;
    }

    @Transactional(readOnly = true)
    public Page<ChampionshipResponse> list(
            String modality,
            ChampionshipStatus status,
            String city,
            LocalDate fromDate,
            Pageable pageable
    ) {
        var user = currentUser.user();
        var normalizedCity = city == null || city.isBlank() ? null : city.strip();
        var normalizedModality = modality == null || modality.isBlank() ? null : modalities.resolveCode(modality);
        return championships.search(normalizedModality, status, normalizedCity, fromDate, user.getRole() == Role.ADMIN, pageable)
                .map(item -> response(item, user));
    }

    @Transactional(readOnly = true)
    public ChampionshipResponse detail(Long id) {
        var user = currentUser.user();
        var championship = find(id);
        if (championship.getStatus() == ChampionshipStatus.RASCUNHO && user.getRole() != Role.ADMIN) {
            throw new NotFoundException("Campeonato não encontrado.");
        }
        return response(championship, user);
    }

    @Transactional
    public ChampionshipResponse create(ChampionshipRequest request) {
        var admin = requireAdmin();
        validateRequest(request);
        if (championships.existsByNameIgnoreCaseAndStartDate(request.name().strip(), request.startDate())) {
            throw new ConflictException("Já existe um campeonato com este nome e data de início.");
        }
        var championship = new ChampionshipEvent();
        apply(championship, request);
        championship.setStatus(ChampionshipStatus.RASCUNHO);
        var saved = championships.save(championship);
        if (request.initialStatus() != null && request.initialStatus() != ChampionshipStatus.RASCUNHO) {
            changeStatus(saved, request.initialStatus());
        }
        audit.record(admin, "Campeonato criado: " + saved.getName(), "CAMPEONATO");
        return response(saved, admin);
    }

    @Transactional
    public ChampionshipResponse update(Long id, ChampionshipRequest request) {
        var admin = requireAdmin();
        var championship = championships.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Campeonato não encontrado."));
        if (championship.getStatus() == ChampionshipStatus.CONCLUIDO
                || championship.getStatus() == ChampionshipStatus.CANCELADO) {
            throw new BusinessException("Campeonatos concluídos ou cancelados não podem ser editados.");
        }
        validateRequest(request);
        var active = enrollments.countByChampionshipIdAndStatus(id, EnrollmentStatus.ATIVA);
        if (request.maxParticipants() < active) {
            throw new BusinessException("O limite não pode ser menor que o número de inscritos ativos.");
        }
        apply(championship, request);
        audit.record(admin, "Campeonato atualizado: " + championship.getName(), "CAMPEONATO");
        return response(championships.save(championship), admin);
    }

    @Transactional
    public ChampionshipResponse updateStatus(Long id, ChampionshipStatus target) {
        var admin = requireAdmin();
        var championship = championships.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Campeonato não encontrado."));
        changeStatus(championship, target);
        var saved = championships.save(championship);
        audit.record(admin, "Status do campeonato " + saved.getName() + " alterado para " + target, "CAMPEONATO");
        return response(saved, admin);
    }

    @Transactional
    public void delete(Long id) {
        var admin = requireAdmin();
        var championship = championships.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Campeonato não encontrado."));
        if (championship.getStatus() != ChampionshipStatus.RASCUNHO
                && championship.getStatus() != ChampionshipStatus.CANCELADO) {
            throw new BusinessException("Somente campeonatos em rascunho ou cancelados podem ser excluídos.");
        }
        if (enrollments.countByChampionshipIdAndStatus(id, EnrollmentStatus.ATIVA) > 0) {
            throw new BusinessException("Não é permitido excluir um campeonato com inscritos ativos.");
        }
        championships.delete(championship);
        audit.record(admin, "Campeonato excluído: " + championship.getName(), "CAMPEONATO");
    }

    @Transactional
    public EnrollmentResponse enroll(Long id) {
        var player = requireClient();
        var championship = championships.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Campeonato não encontrado."));
        validateEnrollmentWindow(championship);
        var existing = enrollments.findByChampionshipIdAndPlayerId(id, player.getId()).orElse(null);
        if (existing != null && existing.getStatus() == EnrollmentStatus.ATIVA) {
            throw new ConflictException("Você já está inscrito neste campeonato.");
        }
        var active = enrollments.countByChampionshipIdAndStatus(id, EnrollmentStatus.ATIVA);
        if (active >= championship.getMaxParticipants()) {
            throw new ConflictException("Não há vagas disponíveis neste campeonato.");
        }
        var enrollment = existing == null ? new ChampionshipEnrollment() : existing;
        enrollment.setChampionship(championship);
        enrollment.setPlayer(player);
        enrollment.setStatus(EnrollmentStatus.ATIVA);
        enrollment.setCancelledAt(null);
        var saved = enrollments.save(enrollment);
        notifications.create(player, "Inscrição confirmada", "Sua inscrição em " + championship.getName() + " foi confirmada.", "CAMPEONATO");
        audit.record(player, "Inscrição realizada no campeonato " + championship.getName(), "CAMPEONATO");
        return enrollmentResponse(saved);
    }

    @Transactional
    public void cancelMyEnrollment(Long championshipId) {
        var player = requireClient();
        var championship = championships.findByIdForUpdate(championshipId)
                .orElseThrow(() -> new NotFoundException("Campeonato não encontrado."));
        if (!LocalDate.now().isBefore(championship.getStartDate())
                || championship.getStatus() == ChampionshipStatus.EM_ANDAMENTO
                || championship.getStatus() == ChampionshipStatus.CONCLUIDO) {
            throw new BusinessException("O prazo para cancelar esta inscrição foi encerrado.");
        }
        var enrollment = enrollments.findByChampionshipIdAndPlayerId(championshipId, player.getId())
                .filter(item -> item.getStatus() == EnrollmentStatus.ATIVA)
                .orElseThrow(() -> new NotFoundException("Inscrição ativa não encontrada."));
        enrollment.setStatus(EnrollmentStatus.CANCELADA);
        enrollment.setCancelledAt(OffsetDateTime.now());
        enrollments.save(enrollment);
        notifications.create(player, "Inscrição cancelada", "Sua inscrição em " + championship.getName() + " foi cancelada.", "CAMPEONATO");
        audit.record(player, "Inscrição cancelada no campeonato " + championship.getName(), "CAMPEONATO");
    }

    @Transactional(readOnly = true)
    public Page<EnrollmentResponse> participants(Long championshipId, Pageable pageable) {
        detail(championshipId);
        return enrollments.findByChampionshipIdAndStatus(championshipId, EnrollmentStatus.ATIVA, pageable)
                .map(this::enrollmentResponse);
    }

    @Transactional(readOnly = true)
    public Page<EnrollmentResponse> myEnrollments(Pageable pageable) {
        return enrollments.findByPlayerIdOrderByCreatedAtDesc(currentUser.user().getId(), pageable)
                .map(this::enrollmentResponse);
    }

    private void validateRequest(ChampionshipRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessException("A data de termino deve ser igual ou posterior a data de inicio.");
        }
        if (request.registrationDeadline().isAfter(request.startDate())) {
            throw new BusinessException("O prazo de inscrição não pode ser posterior ao início do campeonato.");
        }
        var court = courts.findById(request.courtId())
                .orElseThrow(() -> new NotFoundException("Quadra não encontrada."));
        var modality = modalities.requireActive(request.modality()).getCode();
        if (!court.getModality().equals(modality)) {
            throw new BusinessException("A modalidade da quadra deve ser a mesma do campeonato.");
        }
    }

    private void apply(ChampionshipEvent target, ChampionshipRequest request) {
        target.setName(request.name().strip());
        target.setDescription(request.description().strip());
        target.setModality(modalities.requireActive(request.modality()).getCode());
        target.setCourt(courts.findById(request.courtId())
                .orElseThrow(() -> new NotFoundException("Quadra não encontrada.")));
        target.setLocation(request.location().strip());
        target.setCity(request.city().strip());
        target.setStartDate(request.startDate());
        target.setEndDate(request.endDate());
        target.setRegistrationDeadline(request.registrationDeadline());
        target.setMaxParticipants(request.maxParticipants());
        target.setFormat(request.format().strip());
        target.setPrize(request.prize().strip());
        target.setRegistrationFee(request.registrationFee());
        target.setRegulation(request.regulation().strip());
        target.setImageUrl(blankToNull(request.imageUrl()));
        target.setBracket(blankToNull(request.bracket()));
    }

    private void changeStatus(ChampionshipEvent championship, ChampionshipStatus target) {
        if (target == championship.getStatus()) {
            return;
        }
        if (!TRANSITIONS.get(championship.getStatus()).contains(target)) {
            throw new BusinessException("Transição de status não permitida: " + championship.getStatus() + " para " + target + ".");
        }
        if (target == ChampionshipStatus.INSCRICOES_ABERTAS
                && championship.getRegistrationDeadline().isBefore(LocalDate.now())) {
            throw new BusinessException("Não é possível abrir inscrições com o prazo encerrado.");
        }
        championship.setStatus(target);
    }

    private void validateEnrollmentWindow(ChampionshipEvent championship) {
        if (championship.getStatus() != ChampionshipStatus.INSCRICOES_ABERTAS) {
            throw new BusinessException("As inscrições deste campeonato não estão abertas.");
        }
        if (LocalDate.now().isAfter(championship.getRegistrationDeadline())) {
            throw new BusinessException("O prazo de inscrição foi encerrado.");
        }
    }

    private ChampionshipEvent find(Long id) {
        return championships.findById(id)
                .orElseThrow(() -> new NotFoundException("Campeonato não encontrado."));
    }

    private AppUser requireAdmin() {
        var user = currentUser.user();
        if (user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Apenas administradores podem gerenciar campeonatos.");
        }
        return user;
    }

    private AppUser requireClient() {
        var user = currentUser.user();
        if (user.getRole() != Role.CLIENTE) {
            throw new AccessDeniedException("Apenas jogadores podem realizar inscricoes.");
        }
        return user;
    }

    private ChampionshipResponse response(ChampionshipEvent item, AppUser user) {
        var enrolled = enrollments.countByChampionshipIdAndStatus(item.getId(), EnrollmentStatus.ATIVA);
        var currentEnrolled = enrollments.existsByChampionshipIdAndPlayerIdAndStatus(
                item.getId(), user.getId(), EnrollmentStatus.ATIVA);
        return new ChampionshipResponse(
                item.getId(), item.getName(), item.getDescription(), item.getModality(),
                item.getCourt().getId(), item.getCourt().getName(), item.getLocation(), item.getCity(),
                item.getStartDate(), item.getEndDate(), item.getRegistrationDeadline(), item.getMaxParticipants(),
                enrolled, Math.max(0, item.getMaxParticipants() - (int) enrolled), item.getFormat(), item.getPrize(),
                item.getRegistrationFee(), item.getRegulation(), item.getStatus(), item.getImageUrl(), item.getBracket(),
                currentEnrolled, item.getCreatedAt(), item.getUpdatedAt());
    }

    private EnrollmentResponse enrollmentResponse(ChampionshipEnrollment item) {
        return new EnrollmentResponse(
                item.getId(), item.getChampionship().getId(), item.getChampionship().getName(),
                item.getPlayer().getId(), item.getPlayer().getName(), item.getPlayer().getAvatarUrl(),
                item.getStatus(), item.getCreatedAt(), item.getCancelledAt());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
