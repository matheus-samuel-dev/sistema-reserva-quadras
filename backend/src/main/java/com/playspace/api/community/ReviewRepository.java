package com.playspace.api.community;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findTop10ByOrderByCreatedAtDesc();

    boolean existsByReservationId(Long reservationId);

    @Query("select coalesce(avg(r.average), 0) from Review r")
    double globalAverage();
}
