"use client";

import { useState } from "react";
import { useCollaboration } from "@/app/context/CollaborationContext";

// Icons - smaller 14px
const UsersIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CopyIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function CollaborationPanel() {
  const {
    isConnected,
    isCollaborating,
    roomId,
    users,
    localUser,
    startSession,
    joinSession,
    leaveSession,
  } = useCollaboration();

  const [isExpanded, setIsExpanded] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCopyLink = async () => {
    if (roomId) {
      const url = `${window.location.origin}?room=${roomId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = () => {
    if (joinRoomId.trim()) {
      joinSession(joinRoomId.trim());
      setJoinRoomId("");
      setShowJoinInput(false);
    }
  };

  return (
    <>
      {/* Main button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-2 rounded-md transition-all duration-200 flex items-center gap-1.5 shadow-xl border ${
          isCollaborating
            ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700"
            : "bg-[#1E1E24] border-gray-700/50 text-gray-400 hover:text-white hover:bg-[#2a2a32]"
        }`}
        title={isCollaborating ? "Live Session" : "Collaborate"}
      >
        <UsersIcon />
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? "bg-green-400" : "bg-red-400"
          }`}
        />
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <>
          <div
            className="fixed inset-0 z-35"
            onClick={() => setIsExpanded(false)}
          />
          <div className="fixed right-3 top-14 bg-[#1E1E24] border border-gray-700/50 rounded-lg shadow-xl p-3 min-w-[200px] z-40">
            {!isCollaborating ? (
              // Not collaborating - show start/join options
              <div className="space-y-2">
                <p className="text-gray-400 text-[10px]">
                  Share your canvas in real-time
                </p>

                <button
                  onClick={startSession}
                  disabled={!isConnected}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-xs font-medium transition-colors"
                >
                  Start Session
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="px-2 bg-[#1E1E24] text-gray-500">or</span>
                  </div>
                </div>

                {showJoinInput ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) =>
                        setJoinRoomId(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      placeholder="Room code"
                      className="flex-1 px-2 py-1 bg-[#2a2a32] border border-gray-600 rounded text-white placeholder-gray-500 text-xs focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={handleJoin}
                      disabled={!joinRoomId.trim()}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded transition-colors"
                    >
                      <CheckIcon />
                    </button>
                    <button
                      onClick={() => {
                        setShowJoinInput(false);
                        setJoinRoomId("");
                      }}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                    >
                      <XIcon />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowJoinInput(true)}
                    disabled={!isConnected}
                    className="w-full py-1.5 px-3 bg-[#2a2a32] hover:bg-[#3a3a42] disabled:cursor-not-allowed text-gray-300 rounded-md text-xs font-medium transition-colors border border-gray-600"
                  >
                    Join Session
                  </button>
                )}

                {!isConnected && (
                  <p className="text-red-400 text-[10px] text-center">
                    Connecting...
                  </p>
                )}
              </div>
            ) : (
              // Collaborating - show room info and users
              <div className="space-y-2">
                {/* Room ID */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                      Room
                    </p>
                    <p className="text-white font-mono text-sm font-bold">
                      {roomId}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-2 py-1 bg-[#2a2a32] hover:bg-[#3a3a42] text-gray-300 rounded text-[10px] transition-colors"
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Users list */}
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                    Users ({users.length})
                  </p>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a2a32]"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: user.color }}
                        />
                        <span className="text-gray-200 text-[10px]">
                          {user.name}
                          {user.id === localUser?.id && (
                            <span className="text-gray-500 ml-1">(you)</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leave button */}
                <button
                  onClick={leaveSession}
                  className="w-full py-1 px-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs font-medium transition-colors border border-red-600/30"
                >
                  Leave
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
