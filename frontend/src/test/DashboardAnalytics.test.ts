import { describe, expect, it } from 'vitest';
import { aggregatePeakHours, aggregateReservationsByModality } from '../features/admin/dashboardAnalytics';
import type { Reservation } from '../lib/types';

const modalityReservation = (modality: string): Pick<Reservation, 'modality'> => ({ modality });
const hourReservation = (startTime: string): Pick<Reservation, 'startTime'> => ({ startTime });

describe('métricas dinâmicas do dashboard', () => {
  it('descobre modalidades pelas reservas e normaliza variações equivalentes', () => {
    const data = aggregateReservationsByModality([
      modalityReservation('Vôlei'),
      modalityReservation(' volei '),
      modalityReservation('VÔLEI'),
      modalityReservation('Vôlei de Areia'),
      modalityReservation(' vôlei   de areia '),
      modalityReservation('Pickleball')
    ], ['Vôlei', 'Vôlei de Areia']);

    expect(data).toEqual([
      { key: 'volei', name: 'Vôlei', reservas: 3 },
      { key: 'volei de areia', name: 'Vôlei de Areia', reservas: 2 },
      { key: 'pickleball', name: 'Pickleball', reservas: 1 }
    ]);
  });

  it('inclui uma modalidade nova sem depender de lista fixa', () => {
    const before = aggregateReservationsByModality([modalityReservation('Vôlei')]);
    const after = aggregateReservationsByModality([
      modalityReservation('Vôlei'),
      modalityReservation('Vôlei de Areia')
    ]);

    expect(before.map((item) => item.name)).toEqual(['Vôlei']);
    expect(after.map((item) => item.name)).toEqual(['Vôlei', 'Vôlei de Areia']);
  });

  it('não funde modalidades distintas por pontuação', () => {
    const data = aggregateReservationsByModality([
      modalityReservation('Futebol-7'),
      modalityReservation('Futebol 7')
    ], ['Futebol-7', 'Futebol 7']);

    expect(data).toHaveLength(2);
    expect(data.map((item) => item.key)).toEqual(expect.arrayContaining(['futebol-7', 'futebol 7']));
  });

  it('ordena horários por uso e desempata cronologicamente', () => {
    const data = aggregatePeakHours([
      hourReservation('18:00'),
      hourReservation('09:00'),
      hourReservation('18:00'),
      hourReservation('08:00'),
      hourReservation('09:00'),
      hourReservation('20:30')
    ]);

    expect(data).toEqual([
      { hour: '09:00', label: '09h', reservas: 2 },
      { hour: '18:00', label: '18h', reservas: 2 },
      { hour: '08:00', label: '08h', reservas: 1 },
      { hour: '20:30', label: '20:30', reservas: 1 }
    ]);
  });
});
