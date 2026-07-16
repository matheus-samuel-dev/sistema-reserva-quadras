package com.playspace.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SchemaMigrationIntegrationTest {
    @Autowired Flyway flyway;
    @Autowired JdbcTemplate jdbc;

    @Test
    void flywayMigratesTheCompleteSchemaBeforeHibernateValidation() {
        assertThat(flyway.info().current().getVersion().toString()).isEqualTo("5");

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
                "achievement",
                "review",
                "flyway_schema_history"
        ));
    }
}
