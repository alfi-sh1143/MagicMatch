import React from 'react';

interface SimulatedQrCodeProps {
  token: string;
  size?: number;
}

/**
 * Deterministic SVG QR-like visual pattern generated directly in browser
 * without external network or untrusted CDN calls.
 */
export const SimulatedQrCode: React.FC<SimulatedQrCodeProps> = ({ token, size = 160 }) => {
  // Generate deterministic 15x15 matrix from token string
  const gridSize = 15;
  const matrix: boolean[][] = [];

  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash << 5) - hash + token.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < gridSize; c++) {
      // Corner finder markers
      const isTopLeft = r < 4 && c < 4;
      const isTopRight = r < 4 && c >= gridSize - 4;
      const isBottomLeft = r >= gridSize - 4 && c < 4;

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Outline of finder pattern
        const inCorner =
          (r === 0 || r === 3 || c === 0 || c === 3) ||
          (r === 0 || r === 3 || c === gridSize - 4 || c === gridSize - 1) ||
          (r === gridSize - 4 || r === gridSize - 1 || c === 0 || c === 3);
        const centerCorner =
          (r === 1 && c === 1) ||
          (r === 1 && c === gridSize - 2) ||
          (r === gridSize - 2 && c === 1);
        row.push(inCorner || centerCorner);
      } else {
        // Deterministic pseudo-random cell
        const cellHash = (hash * (r + 1) * 31 + c * 17) & 0xffff;
        row.push(cellHash % 2 === 0);
      }
    }
    matrix.push(row);
  }

  const cellSize = size / gridSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="bg-white p-2 rounded-xl shadow-inner select-none"
    >
      {matrix.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize - 0.4}
              height={cellSize - 0.4}
              fill="#09090b"
              rx={cellSize * 0.15}
            />
          ) : null
        )
      )}
    </svg>
  );
};
