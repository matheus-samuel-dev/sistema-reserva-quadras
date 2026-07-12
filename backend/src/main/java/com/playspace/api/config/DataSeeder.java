package com.playspace.api.config;

import com.playspace.api.common.ActivityLog;
import com.playspace.api.common.ActivityLogRepository;
import com.playspace.api.community.Achievement;
import com.playspace.api.community.AchievementRepository;
import com.playspace.api.community.Championship;
import com.playspace.api.community.ChampionshipRepository;
import com.playspace.api.community.CommunityPost;
import com.playspace.api.community.CommunityPostRepository;
import com.playspace.api.community.PartnerAd;
import com.playspace.api.community.PartnerAdRepository;
import com.playspace.api.community.Review;
import com.playspace.api.community.ReviewRepository;
import com.playspace.api.court.Court;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.court.CourtStatus;
import com.playspace.api.court.Modality;
import com.playspace.api.notification.NotificationRepository;
import com.playspace.api.notification.NotificationService;
import com.playspace.api.payment.Payment;
import com.playspace.api.payment.PaymentMethod;
import com.playspace.api.payment.PaymentRepository;
import com.playspace.api.payment.PaymentStatus;
import com.playspace.api.reservation.Reservation;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.Role;
import com.playspace.api.user.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile({"demo", "test"})
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final CourtRepository courts;
    private final ReservationRepository reservations;
    private final PaymentRepository payments;
    private final NotificationRepository notificationRepository;
    private final NotificationService notifications;
    private final ActivityLogRepository activities;
    private final AchievementRepository achievements;
    private final CommunityPostRepository posts;
    private final PartnerAdRepository partnerAds;
    private final ChampionshipRepository championships;
    private final ReviewRepository reviews;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository users,
            CourtRepository courts,
            ReservationRepository reservations,
            PaymentRepository payments,
            NotificationRepository notificationRepository,
            NotificationService notifications,
            ActivityLogRepository activities,
            AchievementRepository achievements,
            CommunityPostRepository posts,
            PartnerAdRepository partnerAds,
            ChampionshipRepository championships,
            ReviewRepository reviews,
            PasswordEncoder passwordEncoder
    ) {
        this.users = users;
        this.courts = courts;
        this.reservations = reservations;
        this.payments = payments;
        this.notificationRepository = notificationRepository;
        this.notifications = notifications;
        this.activities = activities;
        this.achievements = achievements;
        this.posts = posts;
        this.partnerAds = partnerAds;
        this.championships = championships;
        this.reviews = reviews;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.existsByEmail("admin@playspace.com")) {
            return;
        }

        var admin = user("Matheus Santos", "admin@playspace.com", "Admin@123", Role.ADMIN, "Sao Paulo", Modality.BEACH_TENNIS, "Administrador");
        var cliente = user("Marina Costa", "cliente@playspace.com", "Cliente@123", Role.CLIENTE, "Sao Paulo", Modality.BEACH_TENNIS, "Intermediario");
        var lucas = user("Lucas Alves", "lucas@playspace.com", "Cliente@123", Role.CLIENTE, "Campinas", Modality.SOCIETY, "Avancado");
        var carlos = user("Carlos Nunes", "carlos@playspace.com", "Cliente@123", Role.CLIENTE, "Santos", Modality.FUTEVOLEI, "Intermediario");
        var bia = user("Beatriz Lima", "bia@playspace.com", "Cliente@123", Role.CLIENTE, "Sao Paulo", Modality.TENIS, "Iniciante");
        var joao = user("Joao Pereira", "joao@playspace.com", "Cliente@123", Role.CLIENTE, "Osasco", Modality.BASQUETE, "Avancado");
        users.saveAll(List.of(admin, cliente, lucas, carlos, bia, joao));

        var courtList = List.of(
                court("Quadra Aurora", Modality.BEACH_TENNIS, "Areia premium, iluminacao profissional e arquibancada compacta.", 120, 4, CourtStatus.DISPONIVEL, "Setor A", true, false, 4.9),
                court("Quadra Pulse", Modality.FUTEVOLEI, "Espaco aberto com rede oficial, piso drenante e visual de clube.", 110, 6, CourtStatus.DISPONIVEL, "Setor B", true, false, 4.7),
                court("Arena Summit", Modality.SOCIETY, "Campo society coberto com grama sintetica nova e placar digital.", 180, 12, CourtStatus.DISPONIVEL, "Setor C", true, true, 4.8),
                court("Studio Tenis", Modality.TENIS, "Quadra rapida com marcacao profissional e area tecnica.", 115, 4, CourtStatus.DISPONIVEL, "Setor D", true, true, 4.6),
                court("Hangar Volei", Modality.VOLEI, "Quadra coberta com pe direito alto, piso modular e ventilacao.", 95, 12, CourtStatus.EM_MANUTENCAO, "Setor E", true, true, 4.4),
                court("Court Neon", Modality.BASQUETE, "Meia quadra urbana para treinos, duelos e eventos noturnos.", 90, 10, CourtStatus.DISPONIVEL, "Setor F", true, false, 4.5)
        );
        courts.saveAll(courtList);

        var clients = List.of(cliente, lucas, carlos, bia, joao);
        var today = LocalDate.now();
        for (int i = 0; i < 20; i++) {
            var date = today.plusDays((i % 10) - 3L);
            var start = LocalTime.of(8 + (i % 7) * 2, 0);
            var end = start.plusHours(i % 4 == 0 ? 2 : 1);
            var reservation = reservation(
                    "PS-DEMO-" + String.format("%03d", i + 1),
                    clients.get(i % clients.size()),
                    courtList.get(i % courtList.size()),
                    date,
                    start,
                    end,
                    2 + (i % 8),
                    statusFor(date, i),
                    i % 3 == 0 ? PaymentMethod.PIX : i % 3 == 1 ? PaymentMethod.CARTAO_CREDITO : PaymentMethod.CARTAO_DEBITO
            );
            reservations.save(reservation);
            paymentFor(reservation);
        }

        seedNotifications(clients);
        seedActivities();
        seedAchievements(cliente);
        seedCommunity(clients);
        seedChampionships();
        seedReviews(cliente, reservations.findByClientIdOrderByDateDescStartTimeDesc(cliente.getId()).stream()
                .filter(r -> r.getStatus() == ReservationStatus.CONCLUIDA)
                .findFirst()
                .orElse(reservations.findAll().get(0)));
    }

    private AppUser user(String name, String email, String password, Role role, String city, Modality favoriteModality, String level) {
        var user = new AppUser();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setCity(city);
        user.setBio(role == Role.ADMIN ? "Gestor PlaySpace focado em operacao e experiencia premium." : "Jogador PlaySpace apaixonado por esporte, comunidade e bons horarios.");
        user.setMemberSince(LocalDate.now().minusMonths(8));
        user.setFavoriteModality(favoriteModality);
        user.setSportsLevel(level);
        user.setReservationsDone(role == Role.ADMIN ? 0 : 12 + Math.abs(name.hashCode() % 24));
        user.setMatchesPlayed(role == Role.ADMIN ? 0 : 18 + Math.abs(name.hashCode() % 35));
        user.setHoursOnCourt(role == Role.ADMIN ? 0 : 24 + Math.abs(name.hashCode() % 80));
        user.setAttendanceRate(role == Role.ADMIN ? 100 : 86 + Math.abs(name.hashCode() % 13));
        user.setPracticedSports(Set.of("Beach Tennis", "Society", "Tenis"));
        user.setAchievements(Set.of("Primeira Reserva", "Sequencia Ativa"));
        return user;
    }

    private Court court(String name, Modality modality, String description, int price, int capacity, CourtStatus status, String location, boolean lighting, boolean covered, double rating) {
        var court = new Court();
        court.setName(name);
        court.setModality(modality);
        court.setDescription(description);
        court.setPricePerHour(BigDecimal.valueOf(price));
        court.setPlayerCapacity(capacity);
        court.setStatus(status);
        court.setLocation(location);
        court.setLighting(lighting);
        court.setCovered(covered);
        court.setRating(rating);
        court.setImageUrl("/assets/court-" + modality.name().toLowerCase() + ".jpg");
        return court;
    }

    private Reservation reservation(String code, AppUser client, Court court, LocalDate date, LocalTime start, LocalTime end, int players, ReservationStatus status, PaymentMethod method) {
        var reservation = new Reservation();
        reservation.setCode(code);
        reservation.setClient(client);
        reservation.setCourt(court);
        reservation.setModality(court.getModality());
        reservation.setDate(date);
        reservation.setStartTime(start);
        reservation.setEndTime(end);
        reservation.setPlayers(players);
        reservation.setTotalValue(court.getPricePerHour()
                .multiply(BigDecimal.valueOf(Duration.between(start, end).toMinutes()))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
        reservation.setStatus(status);
        reservation.setPaymentMethod(method);
        reservation.setNotes("Reserva demo gerada para apresentacao do portfolio.");
        reservation.setHistory("Seed demo criado; status inicial " + status + ".");
        return reservation;
    }

    private ReservationStatus statusFor(LocalDate date, int i) {
        if (date.isBefore(LocalDate.now())) {
            return i % 5 == 0 ? ReservationStatus.CANCELADA : ReservationStatus.CONCLUIDA;
        }
        if (date.equals(LocalDate.now())) {
            return i % 3 == 0 ? ReservationStatus.EM_ANDAMENTO : ReservationStatus.CONFIRMADA;
        }
        return i % 4 == 0 ? ReservationStatus.PENDENTE : ReservationStatus.CONFIRMADA;
    }

    private void paymentFor(Reservation reservation) {
        var payment = new Payment();
        payment.setReservation(reservation);
        payment.setMethod(reservation.getPaymentMethod());
        payment.setAmount(reservation.getTotalValue());
        payment.setTransactionCode("PAY-DEMO-" + reservation.getCode().substring(reservation.getCode().length() - 3));
        if (reservation.getStatus() == ReservationStatus.PENDENTE) {
            payment.setStatus(PaymentStatus.PENDENTE);
        } else if (reservation.getStatus() == ReservationStatus.CANCELADA) {
            payment.setStatus(PaymentStatus.CANCELADO);
        } else {
            payment.setStatus(PaymentStatus.APROVADO);
            payment.setPaidAt(OffsetDateTime.now().minusDays(1));
        }
        payments.save(payment);
    }

    private void seedNotifications(List<AppUser> clients) {
        clients.forEach(client -> {
            notifications.create(client, "Quadra favorita disponivel", "A Quadra Aurora liberou horarios hoje as 18:00.", "RECOMENDACAO");
            notifications.create(client, "Novo campeonato", "Open PlaySpace de Beach Tennis esta com inscricoes abertas.", "CAMPEONATO");
            notifications.create(client, "Nova conquista", "Voce esta perto de desbloquear Cliente VIP.", "GAMIFICACAO");
        });
    }

    private void seedActivities() {
        List.of(
                activity("Sistema", "Seed de dados demo executado", "AUDITORIA"),
                activity("Marina Costa", "Pagamento PIX aprovado", "PAGAMENTO"),
                activity("Lucas Alves", "Nova reserva na Arena Summit", "RESERVA"),
                activity("Equipe", "Hangar Volei marcado como manutencao", "QUADRA"),
                activity("Carlos Nunes", "Anuncio para parceiro publicado", "COMUNIDADE"),
                activity("Beatriz Lima", "Avaliacao 5 estrelas registrada", "AVALIACAO")
        ).forEach(activities::save);
    }

    private ActivityLog activity(String actor, String action, String category) {
        var log = new ActivityLog();
        log.setActor(actor);
        log.setAction(action);
        log.setCategory(category);
        return log;
    }

    private void seedAchievements(AppUser user) {
        List.of(
                achievement(user, "Medal", "Primeira Reserva", "Criou a primeira reserva no PlaySpace.", 1, 1, LocalDate.now().minusMonths(7)),
                achievement(user, "Sparkles", "Beach Tennis Lover", "Reservou 10 horarios de Beach Tennis.", 8, 10, null),
                achievement(user, "Flame", "Sequencia de 10 jogos", "Mantenha uma sequencia de 10 jogos.", 6, 10, null),
                achievement(user, "Gem", "Cliente VIP", "Complete 25 reservas confirmadas.", 21, 25, null),
                achievement(user, "Trophy", "100 horas em quadra", "Alcance 100 horas acumuladas.", 74, 100, null)
        ).forEach(achievements::save);
    }

    private Achievement achievement(AppUser user, String icon, String title, String description, int progress, int target, LocalDate unlockedAt) {
        var achievement = new Achievement();
        achievement.setUser(user);
        achievement.setIcon(icon);
        achievement.setTitle(title);
        achievement.setDescription(description);
        achievement.setProgress(progress);
        achievement.setTargetValue(target);
        achievement.setPercentComplete(Math.min(100, progress * 100.0 / target));
        achievement.setUnlockedAt(unlockedAt);
        return achievement;
    }

    private void seedCommunity(List<AppUser> clients) {
        for (int i = 0; i < clients.size(); i++) {
            var post = new CommunityPost();
            post.setAuthor(clients.get(i));
            post.setContent(switch (i) {
                case 0 -> "realizou uma nova reserva na Quadra Aurora.";
                case 1 -> "concluiu a 50a partida no PlaySpace.";
                case 2 -> "publicou que procura dupla para Futevolei.";
                case 3 -> "desbloqueou a conquista Cliente VIP.";
                default -> "comentou no campeonato Open PlaySpace.";
            });
            post.setType(i % 2 == 0 ? "RESERVA" : "COMUNIDADE");
            post.setLikes(8 + i * 3);
            post.setComments(1 + i);
            posts.save(post);

            var ad = new PartnerAd();
            ad.setPlayer(clients.get(i));
            ad.setModality(clients.get(i).getFavoriteModality());
            ad.setLevel(clients.get(i).getSportsLevel());
            ad.setCity(clients.get(i).getCity());
            ad.setAvailability("Ter e Qui, 18:00 - 21:00");
            ad.setNotes("Busco parceiro para jogos recorrentes e treinos leves.");
            partnerAds.save(ad);
        }
    }

    private void seedChampionships() {
        var bt = new Championship();
        bt.setName("Open PlaySpace Beach");
        bt.setModality(Modality.BEACH_TENNIS);
        bt.setStartDate(LocalDate.now().plusDays(18));
        bt.setCategories("Duplas B, C e Iniciante");
        bt.setPrize("Troféu, creditos PlaySpace e brindes");
        bt.setStatus("Inscricoes abertas");
        bt.setRegulation("Chaveamento demo com fase de grupos e mata-mata.");
        bt.setBracketDemo("Grupo A -> Semifinais -> Final");

        var society = new Championship();
        society.setName("Liga Society Night");
        society.setModality(Modality.SOCIETY);
        society.setStartDate(LocalDate.now().plusDays(32));
        society.setCategories("Masculino e misto");
        society.setPrize("Mensalidade premium por 30 dias");
        society.setStatus("Em breve");
        society.setRegulation("Todos contra todos em rodada unica.");
        society.setBracketDemo("Tabela corrida demo");

        championships.saveAll(List.of(bt, society));
    }

    private void seedReviews(AppUser user, Reservation reservation) {
        var review = new Review();
        review.setReservation(reservation);
        review.setUser(user);
        review.setCourt(reservation.getCourt());
        review.setCleaning(5);
        review.setLighting(5);
        review.setOrganization(4);
        review.setService(5);
        review.setCourtQuality(5);
        review.setAverage(4.8);
        review.setComment("Estrutura excelente, check-in rapido e iluminacao perfeita para jogo noturno.");
        reviews.save(review);
    }
}
