import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  BriscaPlayerView,
  CronolitoPlayerView,
  EscobaPlayerView,
  ImpostorPlayerView,
  PistaUnicaView,
  ReversiView,
  TimbiricheView,
  TutePlayerView,
} from '@tableria/games';
import { tuteGroupOf } from '@tableria/games';

type MatchPlayer = { seat: number; userId: string; username: string; connected: boolean };

export interface MatchSummaryProps {
  view: unknown;
  players: MatchPlayer[];
  mySeat: number | null;
}

function useSeatLabel(players: MatchPlayer[], mySeat: number | null) {
  const { t } = useTranslation();
  return (seat: number) => (seat === mySeat ? t('partida.matchEnd.you') : (players.find((p) => p.seat === seat)?.username ?? ''));
}

function SummarySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full">
      <p className="mb-2 text-left text-xs font-bold uppercase tracking-wide text-tb-muted">{title}</p>
      <div className="w-full divide-y divide-tb-border overflow-hidden rounded-xl border border-tb-border">
        {children}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3.5 py-2 text-sm ${highlight ? 'bg-tb-accent-tint/40 font-semibold text-tb-accent' : 'text-tb-text'}`}>
      <span className="min-w-0 truncate">{label}</span>
      <span className="tb-nums shrink-0">{value}</span>
    </div>
  );
}

function BriscaSummary({ view: rawView, players, mySeat }: MatchSummaryProps) {
  const { t } = useTranslation();
  const seatLabel = useSeatLabel(players, mySeat);
  const view = rawView as BriscaPlayerView;
  const topRounds = Math.max(...view.matchPoints);

  return (
    <>
      <SummarySection title={t('brisca.matchSummary.title')}>
        {view.matchPoints.map((rounds, seat) => (
          <SummaryRow key={seat} label={seatLabel(seat)} value={t('roundEnd.roundsWon', { n: rounds })} highlight={rounds === topRounds} />
        ))}
      </SummarySection>
      {view.lastRoundSummary && (
        <SummarySection title={t('brisca.matchSummary.lastRoundTitle')}>
          {view.lastRoundSummary.roundPoints.map((points, seat) => (
            <SummaryRow key={seat} label={seatLabel(seat)} value={points} highlight={view.lastRoundSummary!.winnerSeats.includes(seat)} />
          ))}
        </SummarySection>
      )}
    </>
  );
}

function TuteSummary({ view: rawView, players, mySeat }: MatchSummaryProps) {
  const { t } = useTranslation();
  const seatLabel = useSeatLabel(players, mySeat);
  const view = rawView as TutePlayerView;
  const isTeams = view.numPlayers === 4;

  const groupLabel = (group: number) => {
    if (!isTeams) return seatLabel(group);
    const seats = players.filter((p) => tuteGroupOf(p.seat, view.numPlayers) === group);
    return seats.map((p) => seatLabel(p.seat)).join(t('partida.matchEnd.and'));
  };

  const topRounds = Math.max(...view.matchRoundsWon);

  return (
    <>
      <SummarySection title={t('tute.matchSummary.title')}>
        {view.matchRoundsWon.map((rounds, group) => (
          <SummaryRow key={group} label={groupLabel(group)} value={t('roundEnd.roundsWon', { n: rounds })} highlight={rounds === topRounds} />
        ))}
      </SummarySection>
      {view.lastRoundSummary && (
        <SummarySection title={t('tute.matchSummary.lastRoundTitle')}>
          {view.lastRoundSummary.groupPoints.map((points, group) => (
            <SummaryRow key={group} label={groupLabel(group)} value={points} highlight={view.lastRoundSummary!.winnerGroups.includes(group)} />
          ))}
        </SummarySection>
      )}
    </>
  );
}

function EscobaSummary({ view: rawView, players, mySeat }: MatchSummaryProps) {
  const { t } = useTranslation();
  const seatLabel = useSeatLabel(players, mySeat);
  const view = rawView as EscobaPlayerView;
  const topScore = Math.max(...view.scores);
  const hand = view.lastHandSummary;

  return (
    <>
      <SummarySection title={t('escoba.matchSummary.title')}>
        {view.scores.map((score, seat) => (
          <SummaryRow key={seat} label={seatLabel(seat)} value={score} highlight={score === topScore} />
        ))}
      </SummarySection>
      {hand && (
        <SummarySection title={t('escoba.matchSummary.lastHandTitle')}>
          <SummaryRow label={t('escoba.handSummary.cards')} value={hand.cardsWinner !== null ? seatLabel(hand.cardsWinner) : t('escoba.handSummary.nobody')} />
          <SummaryRow label={t('escoba.handSummary.oros')} value={hand.orosWinner !== null ? seatLabel(hand.orosWinner) : t('escoba.handSummary.nobody')} />
          <SummaryRow label={t('escoba.handSummary.velo')} value={hand.veloWinner !== null ? seatLabel(hand.veloWinner) : t('escoba.handSummary.nobody')} />
        </SummarySection>
      )}
    </>
  );
}

function ReversiSummary({ view: rawView, players, mySeat }: MatchSummaryProps) {
  const { t } = useTranslation();
  const seatLabel = useSeatLabel(players, mySeat);
  const view = rawView as ReversiView;
  const counts = [view.board.filter((c) => c === 0).length, view.board.filter((c) => c === 1).length];
  const topCount = Math.max(...counts);

  return (
    <SummarySection title={t('reversi.matchSummary.title')}>
      {counts.map((count, seat) => (
        <SummaryRow key={seat} label={seatLabel(seat)} value={count} highlight={count === topCount} />
      ))}
    </SummarySection>
  );
}

function TimbiricheSummary({ view: rawView, players, mySeat }: MatchSummaryProps) {
  const { t } = useTranslation();
  const seatLabel = useSeatLabel(players, mySeat);
  const view = rawView as TimbiricheView;
  const topScore = Math.max(...view.scores);

  return (
    <SummarySection title={t('timbiriche.matchSummary.title')}>
      {view.scores.map((score, seat) => (
        <SummaryRow key={seat} label={seatLabel(seat)} value={score} highlight={score === topScore} />
      ))}
    </SummarySection>
  );
}

function PistaUnicaSummary({ view: rawView }: MatchSummaryProps) {
  const { t } = useTranslation();
  const view = rawView as PistaUnicaView;

  return (
    <p className="text-sm font-semibold text-tb-text">{t('partida.pistaUnica.score', { score: view.score, total: view.totalRounds })}</p>
  );
}

function CronolitoSummary({ view: rawView, players, mySeat }: MatchSummaryProps) {
  const { t } = useTranslation();
  const seatLabel = useSeatLabel(players, mySeat);
  const view = rawView as CronolitoPlayerView;

  return (
    <SummarySection title={t('cronolito.matchSummary.title')}>
      {view.correctCount.map((correct, seat) => (
        <SummaryRow
          key={seat}
          label={seatLabel(seat)}
          value={`${t('cronolito.matchSummary.correct')}: ${correct} · ${t('cronolito.matchSummary.livesLeft')}: ${view.lives[seat]}`}
        />
      ))}
    </SummarySection>
  );
}

function ImpostorSummary({ view: rawView, players, mySeat }: MatchSummaryProps) {
  const { t } = useTranslation();
  const seatLabel = useSeatLabel(players, mySeat);
  const view = rawView as ImpostorPlayerView;
  const topScore = Math.max(...view.scores);
  const last = view.lastRoundSummary;

  return (
    <>
      <SummarySection title={t('impostor.matchSummary.title')}>
        {view.scores.map((score, seat) => (
          <SummaryRow key={seat} label={seatLabel(seat)} value={score} highlight={score === topScore} />
        ))}
      </SummarySection>
      {last && (
        <SummarySection title={t('impostor.matchSummary.lastRoundTitle')}>
          <SummaryRow label={t('impostor.matchSummary.impostorWas')} value={seatLabel(last.impostor)} />
          <SummaryRow label={t('impostor.matchSummary.wordWas')} value={last.secretWord} />
        </SummarySection>
      )}
    </>
  );
}

/** Componente opcional por juego, montado en el hueco de resumen de `MatchEndPanel` — igual que
 * `BOARD_COMPONENTS`, sin entrada aquí significa que ese juego no pinta nada extra (fallback
 * seguro para juegos futuros). */
export const SUMMARY_COMPONENTS: Partial<Record<string, (props: MatchSummaryProps) => ReactElement | null>> = {
  brisca: BriscaSummary,
  tute: TuteSummary,
  'tute-cabron': TuteSummary,
  escoba: EscobaSummary,
  reversi: ReversiSummary,
  timbiriche: TimbiricheSummary,
  'pista-unica': PistaUnicaSummary,
  impostor: ImpostorSummary,
  cronolito: CronolitoSummary,
};
