"use client";

import { useCollaboration } from "@/app/context/CollaborationContext";

interface UserCursorsProps {
  offset: { x: number; y: number };
  scale: number;
}

export function UserCursors({ offset, scale }: UserCursorsProps) {
  const { remoteCursors, localUser } = useCollaboration();

  if (remoteCursors.size === 0) return null;

  return (
    <svg
      className="pointer-events-none fixed top-0 left-0 w-full h-full z-40"
      style={{ overflow: "visible" }}
    >
      {Array.from(remoteCursors.entries()).map(([userId, cursor]) => {
        // Convert world coordinates to screen coordinates
        const screenX = cursor.x * scale + offset.x;
        const screenY = cursor.y * scale + offset.y;

        return (
          <g key={userId}>
            {/* Cursor pointer */}
            <path
              d={`M ${screenX} ${screenY} 
                  L ${screenX} ${screenY + 18} 
                  L ${screenX + 5} ${screenY + 14} 
                  L ${screenX + 10} ${screenY + 20} 
                  L ${screenX + 13} ${screenY + 18} 
                  L ${screenX + 8} ${screenY + 12} 
                  L ${screenX + 14} ${screenY + 10} 
                  Z`}
              fill={cursor.color}
              stroke="white"
              strokeWidth="1"
              style={{
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
              }}
            />
            {/* User name label */}
            <g transform={`translate(${screenX + 16}, ${screenY + 20})`}>
              <rect
                x="-2"
                y="-10"
                width={cursor.name.length * 7 + 8}
                height="16"
                rx="4"
                fill={cursor.color}
                style={{
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                }}
              />
              <text
                x="2"
                y="2"
                fontSize="11"
                fontFamily="system-ui, sans-serif"
                fontWeight="500"
                fill="white"
              >
                {cursor.name}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
