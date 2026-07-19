package com.playspace.api.config;

import com.playspace.api.championship.ChampionshipEnrollment;
import com.playspace.api.championship.ChampionshipEnrollmentRepository;
import com.playspace.api.championship.ChampionshipEvent;
import com.playspace.api.championship.ChampionshipRepository;
import com.playspace.api.championship.ChampionshipStatus;
import com.playspace.api.championship.EnrollmentStatus;
import com.playspace.api.court.Court;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.partner.PartnerInterest;
import com.playspace.api.partner.PartnerInterestRepository;
import com.playspace.api.partner.PartnerInterestStatus;
import com.playspace.api.partner.PartnerObjective;
import com.playspace.api.partner.SportsAvailability;
import com.playspace.api.partner.SportsLevel;
import com.playspace.api.partner.SportsProfile;
import com.playspace.api.partner.SportsProfileModality;
import com.playspace.api.partner.SportsProfileRepository;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.UserRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Complements the legacy demo dataset with the fully interactive portfolio domains.
 * Every insert is guarded by a stable business key so restarting the application is safe.
 */
@Component
@Profile({"demo", "test"})
public class ProfessionalDemoSeeder {
    private final UserRepository users;
    private final CourtRepository courts;
    private final SportsProfileRepository profiles;
    private final PartnerInterestRepository interests;
    private final ChampionshipRepository championships;
    private final ChampionshipEnrollmentRepository enrollments;

    public ProfessionalDemoSeeder(
            UserRepository users,
            CourtRepository courts,
            SportsProfileRepository profiles,
            PartnerInterestRepository interests,
            ChampionshipRepository championships,
            ChampionshipEnrollmentRepository enrollments
    ) {
        this.users = users;
        this.courts = courts;
        this.profiles = profiles;
        this.interests = interests;
        this.championships = championships;
        this.enrollments = enrollments;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        var marina = users.findByEmail("cliente@playspace.com").orElse(null);
        var lucas = users.findByEmail("lucas@playspace.com").orElse(null);
        var carlos = users.findByEmail("carlos@playspace.com").orElse(null);
        var bia = users.findByEmail("bia@playspace.com").orElse(null);
        var joao = users.findByEmail("joao@playspace.com").orElse(null);
        if (marina == null || lucas == null || carlos == null || bia == null || joao == null || courts.count() == 0) {
            return;
        }

        seedProfile(marina, PartnerObjective.JOGO_CASUAL, "São Paulo", "Pinheiros", "BEACH_TENNIS",
                SportsLevel.INTERMEDIARIO, DayOfWeek.MONDAY, 18, 21,
                "Gosto de jogos equilibrados, treinos leves e novas duplas para os fins de semana.");
        seedProfile(lucas, PartnerObjective.ENCONTRAR_TIME, "Campinas", "Cambuí", "SOCIETY",
                SportsLevel.AVANCADO, DayOfWeek.THURSDAY, 19, 22,
                "Atacante disponível para completar equipes de Society e disputar ligas locais.");
        seedProfile(carlos, PartnerObjective.TREINO, "Santos", "Gonzaga", "FUTEVOLEI",
                SportsLevel.INTERMEDIARIO, DayOfWeek.WEDNESDAY, 18, 21,
                "Procuro parceiros consistentes para evoluir fundamentos de Futevôlei.");
        seedProfile(bia, PartnerObjective.JOGO_CASUAL, "São Paulo", "Moema", "TENIS",
                SportsLevel.INICIANTE, DayOfWeek.SATURDAY, 8, 12,
                "Comecei no Tênis recentemente e busco partidas amistosas aos sábados.");
        seedProfile(joao, PartnerObjective.COMPETICAO, "Osasco", "Centro", "BASQUETE",
                SportsLevel.AVANCADO, DayOfWeek.TUESDAY, 20, 23,
                "Armador focado em treinos intensos e campeonatos amadores de Basquete.");

        seedInterest(lucas, marina, PartnerInterestStatus.PENDENTE,
                "Tenho disponibilidade às quintas. Vamos combinar uma partida?");
        seedInterest(carlos, bia, PartnerInterestStatus.ACEITO,
                "Podemos alternar treinos de condicionamento e técnica.");

        var open = seedChampionship(
                "Open PlaySpace Beach 2026", "BEACH_TENNIS", LocalDate.now().plusDays(18),
                LocalDate.now().plusDays(20), LocalDate.now().plusDays(12), ChampionshipStatus.INSCRICOES_ABERTAS,
                32, "Duplas com fase de grupos e eliminatórias", "Troféus e R$ 2.500 em créditos PlaySpace",
                new BigDecimal("95.00"), "Arena PlaySpace - Setor A", "São Paulo"
        );
        seedChampionship(
                "Liga Society Night", "SOCIETY", LocalDate.now().plusDays(32),
                LocalDate.now().plusDays(60), LocalDate.now().plusDays(20), ChampionshipStatus.INSCRICOES_ENCERRADAS,
                16, "Pontos corridos e final", "Troféu e 30 dias de quadra", new BigDecimal("280.00"),
                "Arena Summit", "São Paulo"
        );
        var ongoing = seedChampionship(
                "Circuito Litoral de Futevôlei", "FUTEVOLEI", LocalDate.now().minusDays(2),
                LocalDate.now().plusDays(1), LocalDate.now().minusDays(7), ChampionshipStatus.EM_ANDAMENTO,
                24, "Grupos e mata-mata", "Troféus e kits esportivos", new BigDecimal("80.00"),
                "Quadra Pulse", "Santos"
        );
        var completed = seedChampionship(
                "Masters PlaySpace de Tênis", "TENIS", LocalDate.now().minusDays(30),
                LocalDate.now().minusDays(28), LocalDate.now().minusDays(40), ChampionshipStatus.CONCLUIDO,
                16, "Eliminatória simples", "Troféu Masters", new BigDecimal("120.00"),
                "Studio Tênis", "São Paulo"
        );

        seedEnrollment(open, marina);
        seedEnrollment(ongoing, carlos);
        seedEnrollment(completed, bia);
    }

    private void seedProfile(
            AppUser user,
            PartnerObjective objective,
            String city,
            String region,
            String modality,
            SportsLevel level,
            DayOfWeek day,
            int startHour,
            int endHour,
            String presentation
    ) {
        if (profiles.existsByUserId(user.getId())) {
            return;
        }
        var profile = new SportsProfile();
        profile.setUser(user);
        profile.setCity(city);
        profile.setRegions(new LinkedHashSet<>(Set.of(region)));
        profile.setObjective(objective);
        profile.setPresentation(presentation);
        profile.setDiscoverable(true);
        profile.setAvatarUrl(user.getAvatarUrl());

        var mainModality = new SportsProfileModality();
        mainModality.setModality(modality);
        mainModality.setLevel(level);
        mainModality.setPrimaryModality(true);
        profile.replaceModalities(new LinkedHashSet<>(Set.of(mainModality)));

        var firstSlot = new SportsAvailability();
        firstSlot.setDayOfWeek(day);
        firstSlot.setStartTime(LocalTime.of(startHour, 0));
        firstSlot.setEndTime(LocalTime.of(endHour, 0));
        var weekendSlot = new SportsAvailability();
        weekendSlot.setDayOfWeek(day == DayOfWeek.SATURDAY ? DayOfWeek.SUNDAY : DayOfWeek.SATURDAY);
        weekendSlot.setStartTime(LocalTime.of(9, 0));
        weekendSlot.setEndTime(LocalTime.of(12, 0));
        profile.replaceAvailabilities(new LinkedHashSet<>(List.of(firstSlot, weekendSlot)));
        profiles.save(profile);
    }

    private void seedInterest(AppUser sender, AppUser receiver, PartnerInterestStatus status, String message) {
        if (interests.findBetween(sender.getId(), receiver.getId()).isPresent()) {
            return;
        }
        var interest = new PartnerInterest();
        interest.setSender(sender);
        interest.setReceiver(receiver);
        interest.setStatus(status);
        interest.setMessage(message);
        if (status != PartnerInterestStatus.PENDENTE) {
            interest.setRespondedAt(OffsetDateTime.now().minusDays(1));
        }
        interests.save(interest);
    }

    private ChampionshipEvent seedChampionship(
            String name,
            String modality,
            LocalDate start,
            LocalDate end,
            LocalDate deadline,
            ChampionshipStatus status,
            int capacity,
            String format,
            String prize,
            BigDecimal fee,
            String location,
            String city
    ) {
        var existing = championships.findAll().stream().filter(item -> item.getName().equalsIgnoreCase(name)).findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }
        var court = court(modality);
        var event = new ChampionshipEvent();
        event.setName(name);
        event.setDescription("Competição oficial da comunidade PlaySpace com organização, regulamento e resultados demonstráveis.");
        event.setModality(modality);
        event.setCourt(court);
        event.setLocation(location);
        event.setCity(city);
        event.setStartDate(start);
        event.setEndDate(end);
        event.setRegistrationDeadline(deadline);
        event.setMaxParticipants(capacity);
        event.setFormat(format);
        event.setPrize(prize);
        event.setRegistrationFee(fee);
        event.setRegulation("Fair play obrigatório. Compareça com 30 minutos de antecedência. O formato segue a descrição do evento.");
        event.setStatus(status);
        event.setBracket(status == ChampionshipStatus.EM_ANDAMENTO || status == ChampionshipStatus.CONCLUIDO
                ? "Quartas de final → Semifinais → Final" : null);
        return championships.save(event);
    }

    private Court court(String modality) {
        return courts.findAll().stream().filter(item -> item.getModality().equals(modality)).findFirst()
                .orElseThrow(() -> new IllegalStateException("Quadra demo ausente para " + modality));
    }

    private void seedEnrollment(ChampionshipEvent championship, AppUser player) {
        if (enrollments.findByChampionshipIdAndPlayerId(championship.getId(), player.getId()).isPresent()) {
            return;
        }
        var enrollment = new ChampionshipEnrollment();
        enrollment.setChampionship(championship);
        enrollment.setPlayer(player);
        enrollment.setStatus(EnrollmentStatus.ATIVA);
        enrollments.save(enrollment);
    }
}
