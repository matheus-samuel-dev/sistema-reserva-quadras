package com.playspace.api.partner;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.common.ConflictException;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.court.Modality;
import com.playspace.api.notification.NotificationService;
import com.playspace.api.security.CurrentUserService;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.Role;
import com.playspace.api.user.UserRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartnerService {
    private final SportsProfileRepository profiles;
    private final PartnerInterestRepository interests;
    private final UserRepository users;
    private final CurrentUserService currentUser;
    private final NotificationService notifications;
    private final AuditService audit;

    public PartnerService(
            SportsProfileRepository profiles,
            PartnerInterestRepository interests,
            UserRepository users,
            CurrentUserService currentUser,
            NotificationService notifications,
            AuditService audit
    ) {
        this.profiles = profiles;
        this.interests = interests;
        this.users = users;
        this.currentUser = currentUser;
        this.notifications = notifications;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public SportsProfileResponse myProfile() {
        var user = requireClient();
        var profile = profiles.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Perfil esportivo ainda não cadastrado."));
        return profileResponse(profile, user);
    }

    @Transactional
    public SportsProfileResponse saveMyProfile(SportsProfileRequest request) {
        var user = requireClient();
        validateProfile(request);
        var profile = profiles.findByUserId(user.getId()).orElseGet(SportsProfile::new);
        profile.setUser(user);
        profile.setCity(request.city().strip());
        profile.setRegions(normalizeRegions(request.regions()));
        profile.setObjective(request.objective());
        profile.setPresentation(request.presentation().strip());
        profile.setPosition(blankToNull(request.position()));
        profile.setDiscoverable(request.discoverable());
        profile.setAvatarUrl(blankToNull(request.avatarUrl()));

        var modalities = request.modalities().stream().map(item -> {
            var modality = new SportsProfileModality();
            modality.setModality(item.modality());
            modality.setLevel(item.level());
            modality.setPrimaryModality(item.modality() == request.primaryModality());
            return modality;
        }).collect(Collectors.toCollection(LinkedHashSet::new));
        profile.replaceModalities(modalities);

        var availabilities = request.availabilities() == null ? Set.<SportsAvailability>of()
                : request.availabilities().stream().map(item -> {
                    var availability = new SportsAvailability();
                    availability.setDayOfWeek(item.dayOfWeek());
                    availability.setStartTime(item.startTime());
                    availability.setEndTime(item.endTime());
                    return availability;
                }).collect(Collectors.toCollection(LinkedHashSet::new));
        profile.replaceAvailabilities(availabilities);
        var saved = profiles.save(profile);
        audit.record(user, "Perfil esportivo atualizado", "PARCEIROS");
        return profileResponse(saved, user);
    }

    @Transactional(readOnly = true)
    public Page<SportsProfileResponse> search(
            String name,
            String city,
            Modality modality,
            SportsLevel level,
            PartnerObjective objective,
            Pageable pageable
    ) {
        var viewer = requireClient();
        return profiles.search(viewer.getId(), normalizeFilter(name), normalizeFilter(city), modality, level, objective, pageable)
                .map(profile -> profileResponse(profile, viewer));
    }

    @Transactional(readOnly = true)
    public SportsProfileResponse detail(Long userId) {
        var viewer = requireClient();
        var profile = profiles.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Perfil esportivo não encontrado."));
        if (!profile.isDiscoverable() && !profile.getUser().getId().equals(viewer.getId())) {
            throw new NotFoundException("Perfil esportivo não encontrado.");
        }
        return profileResponse(profile, viewer);
    }

    @Transactional
    public PartnerInterestResponse sendInterest(Long receiverId, PartnerInterestRequest request) {
        var sender = requireClient();
        if (sender.getId().equals(receiverId)) {
            throw new BusinessException("Não é possível enviar interesse para o próprio perfil.");
        }
        var receiver = users.findById(receiverId)
                .filter(AppUser::isActive)
                .filter(user -> user.getRole() == Role.CLIENTE)
                .orElseThrow(() -> new NotFoundException("Jogador não encontrado."));
        var receiverProfile = profiles.findByUserId(receiverId)
                .filter(SportsProfile::isDiscoverable)
                .orElseThrow(() -> new NotFoundException("Perfil esportivo não encontrado ou indisponível."));
        var existing = interests.findBetween(sender.getId(), receiverId).orElse(null);
        if (existing != null && (existing.getStatus() == PartnerInterestStatus.PENDENTE
                || existing.getStatus() == PartnerInterestStatus.ACEITO)) {
            throw new ConflictException("Ja existe um interesse ativo entre estes jogadores.");
        }
        if (existing != null && !existing.getSender().getId().equals(sender.getId())) {
            throw new ConflictException("Este jogador ja enviou um interesse anteriormente. Consulte suas solicitacoes recebidas.");
        }
        var interest = existing == null ? new PartnerInterest() : existing;
        interest.setSender(sender);
        interest.setReceiver(receiver);
        interest.setMessage(blankToNull(request == null ? null : request.message()));
        interest.setStatus(PartnerInterestStatus.PENDENTE);
        interest.setRespondedAt(null);
        interest.setCancelledAt(null);
        var saved = interests.save(interest);
        notifications.create(receiver, "Novo interesse esportivo", sender.getName() + " quer praticar esportes com voce.", "PARCEIRO");
        audit.record(sender, "Interesse enviado para " + receiver.getName(), "PARCEIROS");
        return interestResponse(saved, sender);
    }

    @Transactional
    public PartnerInterestResponse accept(Long id) {
        return respond(id, PartnerInterestStatus.ACEITO);
    }

    @Transactional
    public PartnerInterestResponse refuse(Long id) {
        return respond(id, PartnerInterestStatus.RECUSADO);
    }

    @Transactional
    public void cancel(Long id) {
        var sender = requireClient();
        var interest = interests.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Interesse não encontrado."));
        if (!interest.getSender().getId().equals(sender.getId())) {
            throw new AccessDeniedException("Somente quem enviou pode cancelar este interesse.");
        }
        if (interest.getStatus() != PartnerInterestStatus.PENDENTE
                && interest.getStatus() != PartnerInterestStatus.ACEITO) {
            throw new BusinessException("Este interesse não pode mais ser cancelado.");
        }
        interest.setStatus(PartnerInterestStatus.CANCELADO);
        interest.setCancelledAt(OffsetDateTime.now());
        interests.save(interest);
        notifications.create(interest.getReceiver(), "Interesse cancelado", sender.getName() + " cancelou o interesse esportivo.", "PARCEIRO");
        audit.record(sender, "Interesse em parceiro cancelado", "PARCEIROS");
    }

    @Transactional(readOnly = true)
    public Page<PartnerInterestResponse> interests(
            InterestDirection direction,
            PartnerInterestStatus status,
            Pageable pageable
    ) {
        var user = requireClient();
        var page = direction == InterestDirection.ENVIADOS
                ? (status == null ? interests.findBySenderId(user.getId(), pageable)
                        : interests.findBySenderIdAndStatus(user.getId(), status, pageable))
                : (status == null ? interests.findByReceiverId(user.getId(), pageable)
                        : interests.findByReceiverIdAndStatus(user.getId(), status, pageable));
        return page.map(item -> interestResponse(item, user));
    }

    private PartnerInterestResponse respond(Long id, PartnerInterestStatus target) {
        var receiver = requireClient();
        var interest = interests.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Interesse não encontrado."));
        if (!interest.getReceiver().getId().equals(receiver.getId())) {
            throw new AccessDeniedException("Somente o destinatario pode responder este interesse.");
        }
        if (interest.getStatus() != PartnerInterestStatus.PENDENTE) {
            throw new BusinessException("Este interesse ja foi respondido ou cancelado.");
        }
        interest.setStatus(target);
        interest.setRespondedAt(OffsetDateTime.now());
        var saved = interests.save(interest);
        var accepted = target == PartnerInterestStatus.ACEITO;
        notifications.create(interest.getSender(), accepted ? "Interesse aceito" : "Interesse recusado",
                receiver.getName() + (accepted ? " aceitou" : " recusou") + " seu interesse esportivo.", "PARCEIRO");
        audit.record(receiver, (accepted ? "Interesse aceito de " : "Interesse recusado de ")
                + interest.getSender().getName(), "PARCEIROS");
        return interestResponse(saved, receiver);
    }

    private void validateProfile(SportsProfileRequest request) {
        var distinctModalities = request.modalities().stream().map(SportsProfileRequest.ModalityLevelRequest::modality)
                .collect(Collectors.toSet());
        if (distinctModalities.size() != request.modalities().size()) {
            throw new BusinessException("Cada modalidade deve aparecer apenas uma vez no perfil.");
        }
        if (!distinctModalities.contains(request.primaryModality())) {
            throw new BusinessException("A modalidade principal deve estar na lista de modalidades praticadas.");
        }
        if (request.availabilities() == null) {
            return;
        }
        request.availabilities().forEach(slot -> {
            if (!slot.startTime().isBefore(slot.endTime())) {
                throw new BusinessException("O horário inicial deve ser anterior ao horário final.");
            }
        });
        var byDay = request.availabilities().stream()
                .collect(Collectors.groupingBy(SportsProfileRequest.AvailabilityRequest::dayOfWeek));
        byDay.values().forEach(slots -> {
            var ordered = slots.stream().sorted(Comparator.comparing(SportsProfileRequest.AvailabilityRequest::startTime)).toList();
            for (int index = 1; index < ordered.size(); index++) {
                if (ordered.get(index).startTime().isBefore(ordered.get(index - 1).endTime())) {
                    throw new BusinessException("Existem horários de disponibilidade sobrepostos no mesmo dia.");
                }
            }
        });
    }

    private Set<String> normalizeRegions(Set<String> regions) {
        if (regions == null) {
            return new LinkedHashSet<>();
        }
        var normalizedKeys = new HashSet<String>();
        return regions.stream().map(String::strip).filter(value -> !value.isBlank())
                .filter(value -> normalizedKeys.add(value.toLowerCase(Locale.ROOT)))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private SportsProfileResponse profileResponse(SportsProfile profile, AppUser viewer) {
        var relationship = interests.findBetween(viewer.getId(), profile.getUser().getId()).orElse(null);
        var primary = profile.getModalities().stream().filter(SportsProfileModality::isPrimaryModality)
                .map(SportsProfileModality::getModality).findFirst().orElse(null);
        var modalityResponses = profile.getModalities().stream()
                .map(item -> new SportsProfileResponse.ModalityLevelResponse(
                        item.getModality(), item.getLevel(), item.isPrimaryModality()))
                .toList();
        var availabilityResponses = profile.getAvailabilities().stream()
                .map(item -> new SportsProfileResponse.AvailabilityResponse(
                        item.getDayOfWeek(), item.getStartTime(), item.getEndTime()))
                .toList();
        var direction = relationship == null ? null
                : relationship.getSender().getId().equals(viewer.getId()) ? InterestDirection.ENVIADOS : InterestDirection.RECEBIDOS;
        return new SportsProfileResponse(
                profile.getId(), profile.getUser().getId(), profile.getUser().getName(),
                profile.getAvatarUrl() == null ? profile.getUser().getAvatarUrl() : profile.getAvatarUrl(),
                profile.getCity(), Set.copyOf(profile.getRegions()), primary, modalityResponses, availabilityResponses,
                profile.getObjective(), profile.getPresentation(), profile.getPosition(), profile.isDiscoverable(),
                relationship == null ? null : relationship.getId(), relationship == null ? null : relationship.getStatus(),
                direction, profile.getUpdatedAt());
    }

    private PartnerInterestResponse interestResponse(PartnerInterest interest, AppUser viewer) {
        var accepted = interest.getStatus() == PartnerInterestStatus.ACEITO;
        String contact = null;
        if (accepted && viewer.getId().equals(interest.getSender().getId())) {
            contact = interest.getReceiver().getEmail();
        } else if (accepted && viewer.getId().equals(interest.getReceiver().getId())) {
            contact = interest.getSender().getEmail();
        }
        return new PartnerInterestResponse(
                interest.getId(), interest.getSender().getId(), interest.getSender().getName(), interest.getSender().getAvatarUrl(),
                interest.getReceiver().getId(), interest.getReceiver().getName(), interest.getReceiver().getAvatarUrl(),
                interest.getStatus(), interest.getMessage(), contact, interest.getCreatedAt(), interest.getRespondedAt(),
                interest.getCancelledAt());
    }

    private AppUser requireClient() {
        var user = currentUser.user();
        if (user.getRole() != Role.CLIENTE) {
            throw new AccessDeniedException("Apenas jogadores podem usar a busca de parceiros.");
        }
        return user;
    }

    private String normalizeFilter(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
