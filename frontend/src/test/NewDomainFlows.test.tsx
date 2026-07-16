import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppDataProvider, useAppData } from '../contexts/AppDataContext';
import { initialState } from '../lib/demoData';
import type { Championship, CommunityComment, CommunityPost, PartnerInterest } from '../lib/types';

let appData!: ReturnType<typeof useAppData>;

function DomainProbe() {
  appData = useAppData();
  return (
    <output data-testid="domain-version">
      {[
        appData.state.posts.length,
        appData.state.championships.length,
        appData.state.partnerInterests.length,
        appData.state.users.length,
        appData.state.preferences.theme
      ].join(':')}
    </output>
  );
}

const renderDomain = () => render(
  <AppDataProvider>
    <DomainProbe />
  </AppDataProvider>
);

const user = (id: string) => initialState.users.find((item) => item.id === id)!;
const dayFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

beforeEach(() => {
  localStorage.clear();
});

describe('fluxos profissionais do modo demonstração', () => {
  it('mantém o ciclo completo de publicação e comentários após recarregar o provider', async () => {
    const marina = user('u-cliente');
    const carlos = user('u-carlos');
    const firstRender = renderDomain();
    let post!: CommunityPost;
    let comment!: CommunityComment;

    await act(async () => {
      post = await appData.saveCommunityPost(
        { content: '  Treino confirmado para sábado de manhã.  ', type: 'Comunidade', modality: 'Beach Tennis' },
        marina
      );
    });
    expect(post.content).toBe('Treino confirmado para sábado de manhã.');

    await act(async () => {
      await appData.likePost(post.id, marina.id);
      comment = await appData.saveCommunityComment(post.id, '  Vamos organizar uma dupla!  ', marina);
    });
    await act(async () => {
      comment = await appData.saveCommunityComment(post.id, 'Vamos organizar duas duplas!', marina, comment.id);
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('playspace-demo-state-v3') ?? '{}');
      const storedPost = stored.state?.posts?.find((item: CommunityPost) => item.id === post.id);
      expect(storedPost?.likes).toBe(1);
      expect(storedPost?.commentItems?.[0]?.content).toBe('Vamos organizar duas duplas!');
    });

    firstRender.unmount();
    renderDomain();
    await waitFor(() => expect(appData.state.posts.some((item) => item.id === post.id)).toBe(true));
    expect(appData.state.posts.find((item) => item.id === post.id)?.likedByUserIds).toContain(marina.id);

    await expect(appData.removeCommunityPost(post.id, carlos)).rejects.toThrow(/próprias publicações/i);
    await act(async () => {
      await appData.removeCommunityComment(post.id, comment.id, marina);
      await appData.removeCommunityPost(post.id, marina);
    });
    await waitFor(() => expect(appData.state.posts.some((item) => item.id === post.id)).toBe(false));
  });

  it('valida CRUD administrativo, transições e inscrição única em campeonatos', async () => {
    renderDomain();
    const admin = user('u-admin');
    const marina = user('u-cliente');
    const draft: Championship = {
      id: '',
      name: 'Copa de Verão PlaySpace',
      description: 'Torneio demonstrativo com fase classificatória.',
      modality: 'Beach Tennis',
      courtId: 'c-aurora',
      courtName: 'Quadra Aurora',
      location: 'Arena PlaySpace',
      city: 'São Paulo',
      startDate: dayFromNow(45),
      endDate: dayFromNow(47),
      registrationDeadline: dayFromNow(40),
      maxParticipants: 24,
      format: 'Fase de grupos e eliminatórias',
      registrationFee: 90,
      categories: 'Duplas B e C',
      regulation: 'Partidas em set único.',
      prize: 'Troféus e créditos PlaySpace',
      status: 'RASCUNHO',
      bracket: []
    };
    let championship!: Championship;

    await act(async () => {
      championship = await appData.saveChampionship(draft, admin);
    });
    await act(async () => {
      championship = await appData.changeChampionshipStatus(championship.id, 'INSCRICOES_ABERTAS', admin);
      championship = await appData.saveChampionship({ ...championship, name: 'Copa de Verão PlaySpace 2026' }, admin);
    });
    expect(appData.state.championships.find((item) => item.id === championship.id)?.name).toContain('2026');

    const openChampionship = appData.state.championships.find((item) => item.id === 'ch-1')!;
    await act(async () => {
      await appData.registerChampionship(openChampionship.id, marina);
    });
    await expect(appData.registerChampionship(openChampionship.id, marina)).rejects.toThrow(/já está inscrito/i);
    await act(async () => {
      await appData.cancelChampionshipEnrollment(openChampionship.id, marina);
    });
    expect(appData.state.championshipEnrollments.find(
      (item) => item.championshipId === openChampionship.id && item.playerId === marina.id
    )?.status).toBe('CANCELADA');

    await act(async () => {
      championship = await appData.changeChampionshipStatus(championship.id, 'CANCELADO', admin);
    });
    await act(async () => {
      await appData.removeChampionship(championship.id, admin);
    });
    await waitFor(() => expect(appData.state.championships.some((item) => item.id === championship.id)).toBe(false));
  });

  it('impede interesses duplicados e respeita destinatário, aceite e cancelamento', async () => {
    renderDomain();
    const marina = user('u-cliente');
    const bia = user('u-bia');
    let interest!: PartnerInterest;

    await act(async () => {
      interest = await appData.sendPartnerInterest(bia.id, 'Vamos jogar no sábado?', marina);
    });
    await expect(appData.sendPartnerInterest(bia.id, 'Mensagem duplicada', marina)).rejects.toThrow(/interesse ativo/i);
    await expect(appData.respondPartnerInterest(interest.id, true, marina)).rejects.toThrow(/destinatário/i);

    await act(async () => {
      interest = await appData.respondPartnerInterest(interest.id, true, bia);
    });
    expect(interest.status).toBe('ACEITO');
    expect(interest.contactEmail).toBe(marina.email);

    await act(async () => {
      await appData.cancelPartnerInterest(interest.id, marina);
    });
    expect(appData.state.partnerInterests.find((item) => item.id === interest.id)?.status).toBe('CANCELADO');
    expect(appData.state.notifications[bia.id]?.some((item) => item.title === 'Novo interesse esportivo')).toBe(true);
  });

  it('permite uma única avaliação para reserva própria concluída e persiste o resultado', async () => {
    renderDomain();
    const marina = user('u-cliente');
    const lucas = user('u-lucas');
    const completed = appData.state.reservations.find((item) => item.id === 'r-11')!;
    const pending = appData.state.reservations.find((item) => item.clientId === marina.id && item.status === 'Pendente')!;
    const ratings = { cleaning: 5, lighting: 4, organization: 5, service: 5, courtQuality: 4 };

    await act(async () => {
      await appData.submitReview(completed.id, ratings, '  Estrutura excelente e equipe muito atenciosa.  ', marina);
    });
    const saved = appData.state.reviews.find((item) => item.reservationId === completed.id);
    expect(saved).toMatchObject({ average: 4.6, comment: 'Estrutura excelente e equipe muito atenciosa.' });
    await expect(appData.submitReview(completed.id, ratings, 'Tentativa duplicada.', marina)).rejects.toThrow(/já foi avaliada/i);
    await expect(appData.submitReview(pending.id, ratings, 'Ainda não terminou.', marina)).rejects.toThrow(/após a conclusão/i);
    await expect(appData.submitReview(completed.id, ratings, 'Reserva de outra pessoa.', lucas)).rejects.toThrow(/próprias reservas/i);
    await waitFor(() => expect(localStorage.getItem('playspace-demo-state-v3')).toContain(completed.id));
  });

  it('salva perfil, perfil esportivo, preferências e cadastro com senha local', async () => {
    renderDomain();
    const marina = user('u-cliente');
    const profile = appData.state.sportsProfiles.find((item) => item.userId === marina.id)!;

    await act(async () => {
      await appData.saveCurrentProfile({
        ...marina,
        profile: { ...marina.profile, city: 'Campinas', phone: '(19) 99999-1234' }
      });
      await appData.saveSportsProfile({
        ...profile,
        city: 'Campinas',
        regions: [...profile.regions, 'Cambuí'],
        presentation: 'Disponível para treinos técnicos e jogos equilibrados.'
      });
      await appData.saveUserPreferences(marina.id, {
        ...appData.state.userPreferences[marina.id],
        theme: 'DARK',
        defaultCity: 'Campinas',
        reservationReminderHours: 4
      });
    });

    expect(appData.state.users.find((item) => item.id === marina.id)?.profile.city).toBe('Campinas');
    expect(appData.state.sportsProfiles.find((item) => item.userId === marina.id)?.regions).toContain('Cambuí');
    expect(appData.state.userPreferences[marina.id].reservationReminderHours).toBe(4);
    expect(appData.state.preferences.theme).toBe('dark');

    let registeredId = '';
    act(() => {
      registeredId = appData.registerDemoUser({
        name: 'Ana Martins',
        email: 'ANA@EXAMPLE.COM',
        password: 'AnaDemo@123',
        phone: '(11) 98888-0000'
      }).id;
    });
    await waitFor(() => expect(appData.state.users.some((item) => item.id === registeredId)).toBe(true));
    expect(appData.state.users.find((item) => item.id === registeredId)?.email).toBe('ana@example.com');
    expect(JSON.parse(localStorage.getItem('playspace-demo-passwords-v1') ?? '{}')['ana@example.com']).toBe('AnaDemo@123');
    expect(() => appData.registerDemoUser({
      name: 'Ana Duplicada', email: 'ana@example.com', password: 'Outra@123'
    })).toThrow(/já existe uma conta/i);
  });
});
