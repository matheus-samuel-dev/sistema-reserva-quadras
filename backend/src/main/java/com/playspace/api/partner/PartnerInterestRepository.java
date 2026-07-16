package com.playspace.api.partner;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PartnerInterestRepository extends JpaRepository<PartnerInterest, Long> {
    Optional<PartnerInterest> findBySenderIdAndReceiverId(Long senderId, Long receiverId);

    @Query("""
            select i from PartnerInterest i
            where (i.sender.id = :first and i.receiver.id = :second)
               or (i.sender.id = :second and i.receiver.id = :first)
            """)
    Optional<PartnerInterest> findBetween(@Param("first") Long first, @Param("second") Long second);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from PartnerInterest i where i.id = :id")
    Optional<PartnerInterest> findByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    Page<PartnerInterest> findBySenderIdAndStatus(Long senderId, PartnerInterestStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    Page<PartnerInterest> findBySenderId(Long senderId, Pageable pageable);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    Page<PartnerInterest> findByReceiverIdAndStatus(Long receiverId, PartnerInterestStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    Page<PartnerInterest> findByReceiverId(Long receiverId, Pageable pageable);
}
