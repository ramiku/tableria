import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrthographicCamera, RoundedBox } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { CONNECT_FOUR_COLS, CONNECT_FOUR_ROWS, type ConnectFourView } from '@tableria/games';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';

const CELL = 1;
/** Colores fijos de "ficha física" — independientes del tema claro/oscuro de la UI, igual que un juego de mesa real no cambia de color con la luz de la habitación. */
const SEAT_COLOR = ['#2f6fe0', '#f0a83d'] as const;
const BOARD_COLOR = '#123a63';
const SLOT_COLOR = '#0a1f3d';
const SLOT_HOVER_COLOR = '#163060';

const BOARD_W = CONNECT_FOUR_COLS * CELL + 0.6;
const BOARD_H = CONNECT_FOUR_ROWS * CELL + 0.6;
/** Margen alrededor del tablero dentro del frustum, para que no quede a ras del borde del lienzo. */
const CAMERA_PAD = 1.08;

function xFor(col: number): number {
  return (col - (CONNECT_FOUR_COLS - 1) / 2) * CELL;
}
function yFor(row: number): number {
  return ((CONNECT_FOUR_ROWS - 1) / 2 - row) * CELL;
}

function Piece({ col, row, seat, isNew }: { col: number; row: number; seat: 0 | 1; isNew: boolean }) {
  // Se congela en el montaje: a esta ficha ya colocada no le importa si `isNew` cambia después
  // (la siguiente jugada de otra columna no debe reproducir de nuevo la caída de esta).
  const [dropsFromAbove] = useState(isNew);
  const restY = yFor(row);
  const { y } = useSpring({
    from: { y: dropsFromAbove ? yFor(-2) : restY },
    to: { y: restY },
    config: { mass: 1, tension: 190, friction: 13 },
  });
  return (
    // rotation-x: un cilindro tiene su eje por defecto en Y (caras circulares arriba/abajo) —
    // rotado 90° queda con la cara circular mirando a cámara, como una ficha/moneda real.
    <animated.mesh position-x={xFor(col)} position-y={y} position-z={0.16} rotation-x={Math.PI / 2} castShadow receiveShadow>
      <cylinderGeometry args={[CELL * 0.42, CELL * 0.42, CELL * 0.22, 32]} />
      <meshStandardMaterial color={SEAT_COLOR[seat]} roughness={0.35} metalness={0.08} />
    </animated.mesh>
  );
}

function GhostPiece({ column, seat }: { column: number; seat: 0 | 1 }) {
  return (
    <mesh position={[xFor(column), yFor(-1), 0.16]} rotation-x={Math.PI / 2}>
      <cylinderGeometry args={[CELL * 0.42, CELL * 0.42, CELL * 0.22, 32]} />
      <meshStandardMaterial color={SEAT_COLOR[seat]} roughness={0.35} metalness={0.08} transparent opacity={0.35} />
    </mesh>
  );
}

function Frame({ hoverColumn }: { hoverColumn: number | null }) {
  return (
    <>
      <RoundedBox args={[BOARD_W, BOARD_H, 0.4]} radius={0.08} position={[0, 0, -0.06]} receiveShadow castShadow>
        <meshStandardMaterial color={BOARD_COLOR} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      {Array.from({ length: CONNECT_FOUR_COLS * CONNECT_FOUR_ROWS }, (_, i) => {
        const col = i % CONNECT_FOUR_COLS;
        const row = Math.floor(i / CONNECT_FOUR_COLS);
        return (
          <mesh key={i} position={[xFor(col), yFor(row), 0.15]}>
            <circleGeometry args={[CELL * 0.44, 32]} />
            <meshStandardMaterial color={col === hoverColumn ? SLOT_HOVER_COLOR : SLOT_COLOR} roughness={0.9} />
          </mesh>
        );
      })}
    </>
  );
}

export function ConnectFourBoard({ matchId, seq, mySeat, myTurn, view: rawView }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as ConnectFourView | undefined;
  const board = view?.board ?? Array(CONNECT_FOUR_ROWS * CONNECT_FOUR_COLS).fill(null);
  const [hoverColumn, setHoverColumn] = useState<number | null>(null);

  // Ficha recién colocada (comparando con la ronda anterior de `seq`): es la única que
  // arranca su animación de caída; el resto de fichas ya puestas se quedan quietas.
  const prevBoardRef = useRef<typeof board | null>(null);
  const [newIndex, setNewIndex] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevBoardRef.current;
    setNewIndex(prev ? board.findIndex((c, i) => c !== null && prev[i] === null) : -1);
    prevBoardRef.current = board;
  }, [seq]);

  function handleDrop(column: number) {
    if (!myTurn || board[column] !== null) return;
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { column } } });
  }

  const canGhost = myTurn && hoverColumn !== null && board[hoverColumn] === null && mySeat !== null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-tb-border bg-tb-surface-2"
        style={{ aspectRatio: `${BOARD_W} / ${BOARD_H}` }}
      >
        <Canvas shadows dpr={[1, 2]} className="!absolute inset-0">
          <OrthographicCamera
            makeDefault
            manual
            position={[0, 0, 10]}
            left={(-BOARD_W / 2) * CAMERA_PAD}
            right={(BOARD_W / 2) * CAMERA_PAD}
            top={(BOARD_H / 2) * CAMERA_PAD}
            bottom={(-BOARD_H / 2) * CAMERA_PAD}
            near={0.1}
            far={100}
          />
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 6]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-3, -2, 4]} intensity={0.25} />
          <Frame hoverColumn={myTurn ? hoverColumn : null} />
          {board.map((cell, i) => {
            if (cell === null) return null;
            const col = i % CONNECT_FOUR_COLS;
            const row = Math.floor(i / CONNECT_FOUR_COLS);
            return <Piece key={i} col={col} row={row} seat={cell} isNew={i === newIndex} />;
          })}
          {canGhost && <GhostPiece column={hoverColumn} seat={mySeat as 0 | 1} />}
          <ContactShadows position={[0, 0, -0.25]} opacity={0.35} scale={10} blur={2.2} far={2} />
        </Canvas>

        {/* Capa accesible: botones reales invisibles superpuestos, mismos aria-label que antes.
            La cámara del Canvas es fija (sin controles de órbita), así que esta rejilla CSS
            queda siempre alineada con la escena 3D sin necesitar ningún cálculo de proyección. */}
        <div
          role="grid"
          aria-label={t('partida.a11y.board')}
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${CONNECT_FOUR_COLS}, 1fr)`, gridTemplateRows: `repeat(${CONNECT_FOUR_ROWS}, 1fr)` }}
        >
          {board.map((cell, i) => {
            const column = i % CONNECT_FOUR_COLS;
            const row = Math.floor(i / CONNECT_FOUR_COLS);
            const columnFull = board[column] !== null;
            const content =
              cell === null ? t('partida.a11y.empty') : cell === mySeat ? t('partida.a11y.myPiece') : t('partida.a11y.opponentPiece');
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleDrop(column)}
                onMouseEnter={() => setHoverColumn(column)}
                onMouseLeave={() => setHoverColumn((c) => (c === column ? null : c))}
                onFocus={() => setHoverColumn(column)}
                onBlur={() => setHoverColumn((c) => (c === column ? null : c))}
                disabled={!myTurn || columnFull}
                aria-label={t('partida.a11y.column', { col: column + 1, row: row + 1, content })}
                className="cursor-pointer opacity-0 outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tb-accent disabled:cursor-default"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
