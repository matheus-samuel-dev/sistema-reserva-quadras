package com.playspace.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SchemaMigrationIntegrationTest {
    @Autowired Flyway flyway;
    @Autowired JdbcTemplate jdbc;

    @Test
    void flywayMigratesTheCompleteSchemaBeforeHibernateValidation() {
        assertThat(flyway.info().current().getVersion().toString()).isEqualTo("6");

        var tables = jdbc.queryForList(
                """
                select table_name
                from information_schema.tables
                where table_schema = 'public'
                """,
                String.class
        );

        assertThat(tables).containsAll(List.of(
                "users",
                "user_sports",
                "user_achievements",
                "court",
                "reservation",
                "payment",
                "notification",
                "activity_log",
                "community_post",
                "community_comment",
                "community_post_like",
                "partner_ad",
                "sports_profile",
                "sports_profile_region",
                "sports_profile_modality",
                "sports_availability",
                "partner_interest",
                "championship",
                "championship_event",
                "championship_enrollment",
                "user_preferences",
                "platform_settings",
                "sport_modality",
                "achievement",
                "review",
                "flyway_schema_history"
        ));

        assertThat(jdbc.queryForObject("select count(*) from sport_modality", Integer.class)).isEqualTo(6);
        assertThat(jdbc.queryForList("select code from sport_modality order by code", String.class))
                .contains("BEACH_TENNIS", "FUTEVOLEI", "SOCIETY", "TENIS", "VOLEI", "BASQUETE");

        var settingsColumns = jdbc.queryForList(
                "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'platform_settings'",
                String.class
        );
        assertThat(settingsColumns).doesNotContain(
                "enabled_modalities", "beach_tennis_price", "futevolei_price", "society_price",
                "tenis_price", "volei_price", "basquete_price"
        );

        var foreignKeys = jdbc.queryForList(
                "select constraint_name from information_schema.table_constraints where table_schema = 'public' and constraint_type = 'FOREIGN KEY'",
                String.class
        );
        assertThat(foreignKeys).contains(
                "fk_users_favorite_modality_catalog", "fk_court_modality_catalog",
                "fk_reservation_modality_catalog", "fk_community_post_modality_catalog",
                "fk_partner_ad_modality_catalog", "fk_championship_modality_catalog",
                "fk_championship_event_modality_catalog", "fk_sports_profile_modality_catalog",
                "fk_user_sports_catalog"
        );
    }

    @Test
    void migrationSixPreservesAndDeduplicatesFreeFormLegacySports() {
        var url = "jdbc:h2:mem:playspace-legacy-upgrade-" + java.util.UUID.randomUUID()
                + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        var legacyFlyway = Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion("5"))
                .load();
        legacyFlyway.migrate();

        var legacy = new JdbcTemplate(new DriverManagerDataSource(url, "sa", ""));
        legacy.update("""
                insert into users (
                    name, email, password, role, active, reservations_done, matches_played,
                    hours_on_court, attendance_rate, created_at, updated_at
                ) values (?, ?, ?, 'CLIENTE', true, 0, 0, 0, 100, current_timestamp, current_timestamp)
                """, "Pessoa legada", "legado@playspace.test", "hash");
        var userId = legacy.queryForObject("select id from users where email = ?", Long.class, "legado@playspace.test");
        List.of("Vôlei", "Vôlei de Areia", "  Volei   de Areia  ", "Futebol-7", "Futebol 7")
                .forEach(sport -> legacy.update("insert into user_sports (user_id, sport) values (?, ?)", userId, sport));

        Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration")
                .load()
                .migrate();

        assertThat(legacy.queryForObject(
                "select count(*) from sport_modality where normalized_name = 'volei de areia'", Integer.class
        )).isEqualTo(1);
        assertThat(legacy.queryForObject(
                "select count(*) from sport_modality where normalized_name in ('futebol-7', 'futebol 7')", Integer.class
        )).isEqualTo(2);
        assertThat(legacy.queryForList(
                "select sport from user_sports where user_id = ? order by sport", String.class, userId
        )).hasSize(4).contains("VOLEI");
        assertThat(legacy.queryForObject(
                """
                select count(*)
                from user_sports sports
                join sport_modality modality on modality.code = sports.sport
                where sports.user_id = ?
                """, Integer.class, userId
        )).isEqualTo(4);
    }
}
