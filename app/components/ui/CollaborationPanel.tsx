"use client";

import { useState } from "react";
import { useCollaboration } from "@/app/context/CollaborationContext";

// Icons
const UsersIcon = () => (
  <svg
    width="18"
    height="18"
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
    width="16"
    height="16"
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
    width="16"
    height="16"
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
    width="16"
    height="16"
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
    <div className="fixed top-4 right-4 z-50">
      {/* Main button / collapsed state */}
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl border transition-all duration-200 ${
            isCollaborating
              ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700"
              : "bg-[#1E1E24] border-gray-700/50 text-gray-300 hover:text-white hover:bg-[#2a2a32]"
          }`}
        >
          <UsersIcon />
          <span className="text-sm font-medium">
            {isCollaborating ? `Live (${users.length})` : "Collaborate"}
          </span>
          {/* Connection indicator */}
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-400" : "bg-red-400"
            }`}
          />
        </button>

        {/* Expanded panel */}
        {isExpanded && (
          <div className="bg-[#1E1E24] border border-gray-700/50 rounded-xl shadow-2xl p-4 min-w-[280px]">
            {!isCollaborating ? (
              // Not collaborating - show start/join options
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">
                  Share your canvas in real-time
                </p>

                <button
                  onClick={startSession}
                  disabled={!isConnected}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Start Session
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#1E1E24] text-gray-500">or</span>
                  </div>
                </div>

                {showJoinInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) =>
                        setJoinRoomId(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      placeholder="Enter room code"
                      className="flex-1 px-3 py-2 bg-[#2a2a32] border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={handleJoin}
                      disabled={!joinRoomId.trim()}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <CheckIcon />
                    </button>
                    <button
                      onClick={() => {
                        setShowJoinInput(false);
                        setJoinRoomId("");
                      }}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                    >
                      <XIcon />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowJoinInput(true)}
                    disabled={!isConnected}
                    className="w-full py-2.5 px-4 bg-[#2a2a32] hover:bg-[#3a3a42] disabled:cursor-not-allowed text-gray-300 rounded-lg font-medium transition-colors border border-gray-600"
                  >
                    Join Session
                  </button>
                )}

                {!isConnected && (
                  <p className="text-red-400 text-xs text-center">
                    Connecting to server...
                  </p>
                )}
              </div>
            ) : (
              // Collaborating - show room info and users
              <div className="space-y-4">
                {/* Room ID */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">
                      Room Code
                    </p>
                    <p className="text-white font-mono text-lg font-bold">
                      {roomId}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a32] hover:bg-[#3a3a42] text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                {/* Users list */}
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                    Participants ({users.length})
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#2a2a32]"
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: user.color }}
                        />
                        <span className="text-gray-200 text-sm">
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
                  className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors border border-red-600/30"
                >
                  Leave Session
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
